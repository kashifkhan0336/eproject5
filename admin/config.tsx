import React from "react";
 // Adjust the path according to your directory structure

function CustomLogo() {
    return <img src={require('./logop.png').default.src} alt="LuxuryStay Hospitality Logo" style={{ width: '150px', height: 'auto' }} />;
}

export const components = {
    Logo: CustomLogo
};
