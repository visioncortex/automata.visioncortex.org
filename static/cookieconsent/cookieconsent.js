import "/cookieconsent/cookieconsent.umd.js";

function askCookieConsent() {
    CookieConsent.run({
        guiOptions: {
            consentModal: {
                layout: "box",
                position: "bottom left",
                equalWeightButtons: false,
                flipButtons: false
            },
            preferencesModal: {
                layout: "box",
                position: "right",
                equalWeightButtons: false,
                flipButtons: false
            }
        },
        categories: {
            necessary: {
                readOnly: true
            },
            analytics: {},
        },
        language: {
            default: "en",
            autoDetect: "browser",
            translations: {
                en: {
                    consentModal: {
                        title: "Cookie Settings",
                        description: "By clicking \"Accept all cookies\", you agree visioncortex.org to store cookies on your device and disclose information in accordance with our Cookie Policy.",
                        acceptAllBtn: "Accept all cookies",
                        acceptNecessaryBtn: "Necessary cookies only",
                        showPreferencesBtn: "Customize settings",
                        footer: null,
                    },
                    preferencesModal: {
                        title: "Cookie Consent Preference Center",
                        acceptAllBtn: "Accept all cookies",
                        acceptNecessaryBtn: "Necessary cookies only",
                        savePreferencesBtn: "Confirm my choices",
                        closeIconLabel: "Close",
                        sections: [
                            {
                                title: "Cookie Usage",
                                description: "When you visit our website, it may store or retrieve information on your browser, mostly in the form of cookies. This information might be about you, your preferences, or your device and is mostly used to make the site work as you expect it to. Because we respect your right to privacy, you can choose not to allow some types of cookies."
                            },
                            {
                                title: "Strictly Necessary Cookies <span class=\"pm__badge\">Always Enabled</span>",
                                description: "These cookies are necessary for the website to function and cannot be switched off in our systems. They do not store any personally identifiable information.",
                                linkedCategory: "necessary"
                            },
                            {
                                title: "Analytics Cookies",
                                description: "These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. All information these cookies collect is aggregated and therefore anonymous.",
                                linkedCategory: "analytics"
                            },
                        ]
                    }
                }
            }
        },
        onFirstConsent: ({ cookie }) => {
            updateClarityConsent(cookie);
        },
        onConsent: ({ cookie }) => {
            updateClarityConsent(cookie);
        },
        onChange: ({ cookie }) => {
            updateClarityConsent(cookie);
        },
    });
}

function updateClarityConsent(cookie) {
    const consent = {
        analytics_Storage: cookie.categories.includes("analytics") ? "granted" : "denied",
    };
    window.clarity("consentv2", consent);
}

setTimeout(askCookieConsent, 5000);
