import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#e11d48",
                plum: "#4a304b",
                sage: "#a4b9bc",
                gold: "#c2a05b",
                cream: "#f9f8f4",
            },
        },
    },
    plugins: [],
};
export default config;
