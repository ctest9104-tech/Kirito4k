import React, { useEffect } from 'react';

const Kirito4k = () => {
    useEffect(() => {
        // Initialize VsEmbed API
        const vsEmbedScript = document.createElement('script');
        vsEmbedScript.src = 'https://embed.vsembed.com/sdk.js'; // Adjust URL as needed
        vsEmbedScript.async = true;

        vsEmbedScript.onload = () => {
            // Call VsEmbed API functions here
            console.log('VsEmbed API loaded successfully.');
        };

        document.body.appendChild(vsEmbedScript);

        return () => {
            document.body.removeChild(vsEmbedScript);
        };
    }, []);

    return (
        <div>
            <h1>Kirito 4K Component</h1>
            <div id="vsEmbedContainer">
                {/* VsEmbed related content goes here */}
            </div>
        </div>
    );
};

export default Kirito4k;