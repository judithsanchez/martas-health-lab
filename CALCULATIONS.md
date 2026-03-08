# Fórmulas de Cálculo / Calculation Formulas

Este documento detalla las ecuaciones científicas y heurísticas utilizadas en Marta's Health Lab para calcular métricas de composición corporal cuando no están disponibles directamente en los registros importados.

This document details the scientific and heuristic equations used in Marta's Health Lab to calculate body composition metrics when they are not directly available in imported records.

---

### 1. Ingesta Calórica Diaria (DCI) / Basal Metabolic Rate (BMR)

Utilizamos la ecuación de **Mifflin-St Jeor**, que es el estándar actual para estimar el metabolismo basal.

We use the **Mifflin-St Jeor** equation, the current standard for estimating basal metabolism.

- **Hombres / Men**: `(10 × peso_kg) + (6.25 × altura_cm) - (5 × edad) + 5`
- **Mujeres / Women**: `(10 × peso_kg) + (6.25 × altura_cm) - (5 × edad) - 161`

**DCI** = `BMR × Factor de Actividad`

- Sedentario (1 sesión/sem): `1.2`
- Activo (3 sesiones/sem): `1.55`
- Muy Activo (5+ sesiones/sem): `1.725`

---

### 2. Masa Ósea Estimada / Estimated Bone Mass

Cuando falta el dato de masa ósea, utilizamos una regresión basada en el peso corporal y género (estándar de la industria para estimaciones rápidas).

When bone mass data is missing, we use a regression based on body weight and gender (industry standard for quick estimates).

**Mujeres / Women:**

- `< 50 kg`: 1.95 kg
- `50 kg - 75 kg`: 2.40 kg
- `> 75 kg`: 2.95 kg

**Hombres / Men:**

- `< 65 kg`: 2.66 kg
- `65 kg - 95 kg`: 3.29 kg
- `> 95 kg`: 3.69 kg

---

### 3. Masa Muscular / Muscle Mass

Calculada mediante el método de exclusión de masa por compartimentos.

Calculated using the compartment mass exclusion method.

`Masa Muscular = Peso Total - Masa Grasa - Masa Ósea`
`Muscle Mass = Total Weight - Fat Mass - Bone Mass`

Donde / Where:
`Masa Grasa = Peso Total × (Porcentaje de Grasa / 100)`

---

### 4. Edad Metabólica / Metabolic Age

Estimación basada en la desviación del porcentaje de grasa respecto a los niveles óptimos de salud.

Estimation based on the deviation of the fat percentage relative to optimal health levels.

`Edad Metabólica = Edad Cronológica + (Grasa % - Grasa_Objetivo) × 0.5`

- **Grasa Objetivo Mujeres**: 23%
- **Grasa Objetivo Hombres**: 15%

_Nota: El resultado está limitado a un ajuste máximo de +/- 15 años respecto a la edad real y un mínimo absoluto de 12 años._

---

### 5. IMC / BMI

`IMC = Peso (kg) / Altura (m)²`
