const config = {
    trailingComma: "none",
    printWidth: 100,
    tabWidth: 4,

    overrides: [
        {
            files: ["*.yml", "*.yaml"],
            options: {
                tabWidth: 2,
                useTabs: false
            }
        }
    ]
};

export default config;
