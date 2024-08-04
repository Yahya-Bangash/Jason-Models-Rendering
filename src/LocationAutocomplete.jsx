import React, { useState } from 'react';
import { Autocomplete } from '@react-google-maps/api';

const LocationAutocomplete = ({ country }) => {
    const [inputValue, setInputValue] = useState('');
    const [autocomplete, setAutocomplete] = useState(null);

    const handleLoad = (autocompleteInstance) => {
        setAutocomplete(autocompleteInstance);
    };

    const handlePlaceChanged = () => {
        if (autocomplete) {
            const place = autocomplete.getPlace();
            setInputValue(place.formatted_address);
        }
    };

    return (
        <div>
            <Autocomplete
                onLoad={handleLoad}
                onPlaceChanged={handlePlaceChanged}
                restrictions={{ country }}
            >
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter a location"
                    style={{ width: '300px', height: '40px' }}
                />
            </Autocomplete>
        </div>
    );
};

export default LocationAutocomplete;
