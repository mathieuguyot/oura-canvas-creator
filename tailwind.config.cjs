/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    plugins: [require("daisyui")],
    daisyui: {
        themes: [
            "light",
            "dark",
            "nord"
          ]
    }
};
