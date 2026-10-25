#!/usr/bin/env python3
"""Refuse an unattended release when the reviewed Pi boundary has drifted.

This checks configuration only. It neither restarts services nor reads records.
Policy changes need a separately reviewed migration, not removal of this check.
"""
import argparse
import json
import pathlib
import subprocess
import sys


def docker_json(*args):
    return json.loads(subprocess.check_output(['docker', *args], text=True))


def verify_compose(project, profile, compose_file):
    rendered = docker_json('compose', '--project-name', 'martas-health-lab',
                           '--project-directory', str(project), '-f', str(compose_file),
                           'config', '--format', 'json')
    assert rendered['name'] == 'martas-health-lab'
    assert set(rendered['services']) == {'app'}
    service = rendered['services']['app']
    assert set(service) <= {'build', 'command', 'entrypoint', 'container_name', 'user',
                           'cap_drop', 'security_opt', 'init', 'restart', 'ports',
                           'volumes', 'environment', 'healthcheck', 'logging', 'networks', 'image'}
    assert service.get('command') is None and service.get('entrypoint') is None
    assert service['container_name'] == 'martas-lab' and service['user'] == '1000:1000'
    assert service['image'] == 'martas-health-lab-app:latest'
    assert service['cap_drop'] == ['ALL'] and service['init'] is True
    assert service['restart'] == 'unless-stopped'
    assert service['security_opt'] == ['no-new-privileges:true', 'seccomp:' + str(profile)]
    assert service['ports'] == [{'mode': 'ingress', 'target': 3000, 'published': '3000', 'protocol': 'tcp'}]
    assert len(service['volumes']) == 1
    volume = dict(service['volumes'][0])
    assert volume.pop('bind', {}) in ({}, {'create_host_path': True})
    assert volume == {'type': 'bind', 'source': str(project / 'data'), 'target': '/app/data'}
    assert service['environment'] == {'DATABASE_URL': 'file:/app/data/prod.db', 'NEXT_PUBLIC_APP_URL': 'http://localhost:3000'}
    assert service['networks'] == {'default': None}
    assert set(rendered['networks']) == {'default'}
    network = dict(rendered['networks']['default'])
    assert not network.pop('ipam', {})
    assert network == {'name': 'martas-health-lab_default'}
    assert service['logging'] == {'driver': 'json-file', 'options': {'max-file': '3', 'max-size': '10m'}}
    assert service['healthcheck'] == {
        'test': ['CMD', 'node', '-e', "fetch('http://127.0.0.1:3000').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"],
        'interval': '30s', 'timeout': '10s', 'retries': 3, 'start_period': '30s'}
    return service


def verify(project, profile, container, compose_file):
    desired = verify_compose(project, profile, compose_file)
    current = docker_json('inspect', container)[0]
    host = current['HostConfig']
    config = current['Config']
    expected_policy = json.loads(profile.read_text())
    assert expected_policy['defaultAction'] == 'SCMP_ACT_ERRNO'
    assert current['State']['Running'], 'App must be running before release'
    assert current['State'].get('Health', {}).get('Status') == 'healthy', 'App must be healthy'
    assert not host['Privileged'] and not host['CapAdd']
    assert host['CapDrop'] == ['ALL'], 'Capability boundary differs'
    options = host['SecurityOpt'] or []
    seccomp = [o.split('=', 1)[1] for o in options if o.startswith('seccomp=')]
    assert len(seccomp) == 1 and json.loads(seccomp[0]) == expected_policy, 'Seccomp boundary differs'
    assert len(options) == 2 and any(o in ('no-new-privileges', 'no-new-privileges:true') for o in options)
    assert config['User'] == '1000:1000' and host['Init'] is True
    assert host['Binds'] == [str(project / 'data') + ':/app/data:rw'], 'Mounts differ'
    assert host['PortBindings'] == {'3000/tcp': [{'HostIp': '', 'HostPort': '3000'}]}, 'Ports differ'
    assert host['RestartPolicy'] == {'Name': 'unless-stopped', 'MaximumRetryCount': 0}
    assert host['NetworkMode'] == 'martas-health-lab_default'
    assert set(current['NetworkSettings']['Networks']) == {'martas-health-lab_default'}
    assert host['ShmSize'] == 67108864 and host['ReadonlyRootfs'] is False
    assert host['LogConfig'] == {'Type': 'json-file', 'Config': {'max-file': '3', 'max-size': '10m'}}
    assert not host.get('Devices') and not host.get('DeviceRequests')
    assert not host.get('PidMode') and host.get('IpcMode') == 'private'
    assert not host.get('Sysctls') and not host.get('ExtraHosts')
    assert not host.get('Dns') and not host.get('DnsSearch') and not host.get('DnsOptions')
    assert not host.get('VolumesFrom') and not host.get('DeviceCgroupRules')
    assert not host.get('CpusetCpus') and not host.get('CpusetMems')
    assert host.get('PidsLimit') in (None, 0)
    assert all(not host.get(k) for k in ('Memory', 'MemorySwap', 'MemoryReservation', 'NanoCpus',
                                       'CpuQuota', 'CpuPeriod', 'CpuShares', 'BlkioWeight'))
    health = config['Healthcheck']
    assert health['Test'] == desired['healthcheck']['test']
    assert health['Interval'] == 30000000000 and health['Timeout'] == 10000000000
    assert health['Retries'] == 3 and health['StartPeriod'] == 30000000000
    environment = dict(item.split('=', 1) for item in config['Env'])
    base = dict(item.split('=', 1) for item in docker_json('image', 'inspect', current['Image'])[0]['Config']['Env'])
    expected_overrides = {'DATABASE_URL': 'file:/app/data/prod.db', 'NEXT_PUBLIC_APP_URL': 'http://localhost:3000'}
    assert all(environment.get(k) == v for k, v in expected_overrides.items())
    assert all(k in expected_overrides or base.get(k) == v for k, v in environment.items()), 'Extra runtime environment overrides'
    return {'boundary_verified': True, 'image': current['Image'], 'container': current['Id']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', type=pathlib.Path, required=True)
    parser.add_argument('--profile', type=pathlib.Path, required=True)
    parser.add_argument('--compose-file', type=pathlib.Path, required=True)
    parser.add_argument('--container', default='martas-lab')
    args = parser.parse_args()
    try:
        print(json.dumps(verify(args.project.resolve(), args.profile.resolve(), args.container, args.compose_file)))
    except Exception:
        # Do not publish inspect payloads, environment values or app logs to CI.
        print('Production boundary verification failed; stop and review locally.', file=sys.stderr)
        sys.exit(1)
