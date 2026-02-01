"use client";

import { useState } from "react";
import { createClient, updateClient } from "@/lib/actions/clients";

type ClientFormProps = {
    client?: {
        id: number;
        name: string;
        lastname?: string | null;
        username?: string | null;
        birthday?: string | null;
        gender?: string | null;
        height?: number | null;
        activityLevel?: number | null;
        sessionsPerWeek?: number | null;
        startDate?: string | null;
        email?: string | null;
        phone?: string | null;
    };
    onClose: () => void;
    onSuccess: () => void;
};

export function ClientForm({ client, onClose, onSuccess }: ClientFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        try {
            const data = {
                name: formData.get("name") as string,
                lastname: formData.get("lastname") as string,
                username: formData.get("username") as string,
                birthday: formData.get("birthday") as string,
                gender: formData.get("gender") as string,
                height: formData.get("height") ? parseFloat(formData.get("height") as string) : undefined,
                activityLevel: formData.get("activityLevel") ? parseInt(formData.get("activityLevel") as string) : undefined,
                sessionsPerWeek: formData.get("sessionsPerWeek") ? parseInt(formData.get("sessionsPerWeek") as string) : undefined,
                startDate: formData.get("startDate") as string,
                email: formData.get("email") as string,
                phone: formData.get("phone") as string,
            };

            if (client) {
                await updateClient(client.id, data);
            } else {
                await createClient(data);
            }
            onSuccess();
        } catch (e: any) {
            setError(e.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">{client ? "Edit Client" : "New Client"}</h2>
                </div>

                <form action={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">First Name *</label>
                            <input
                                name="name"
                                defaultValue={client?.name}
                                required
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Last Name</label>
                            <input
                                name="lastname"
                                defaultValue={client?.lastname || ""}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Username</label>
                            <input
                                name="username"
                                defaultValue={client?.username || ""}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Birthday</label>
                            <input
                                type="date"
                                name="birthday"
                                defaultValue={client?.birthday || ""}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Gender</label>
                            <select
                                name="gender"
                                defaultValue={client?.gender || "female"}
                                className="w-full px-3 py-2 border rounded-md"
                            >
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Height (cm)</label>
                            <input
                                type="number"
                                step="0.1"
                                name="height"
                                defaultValue={client?.height || ""}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Activity Level</label>
                            <select
                                name="activityLevel"
                                defaultValue={client?.activityLevel || ""}
                                className="w-full px-3 py-2 border rounded-md"
                            >
                                <option value="">Select...</option>
                                <option value="1">1 - Sedentary</option>
                                <option value="2">2 - Active</option>
                                <option value="3">3 - Very Active</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Sessions / Week</label>
                            <input
                                type="number"
                                name="sessionsPerWeek"
                                defaultValue={client?.sessionsPerWeek || ""}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                defaultValue={client?.startDate || ""}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email</label>
                            <input
                                type="email"
                                name="email"
                                defaultValue={client?.email || ""}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                defaultValue={client?.phone || ""}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save Client"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
