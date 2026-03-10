import React, { useEffect, useMemo, useState } from "react";

const filters = ["Fast Delivery", "New on OvenRush", "Pure Veg", "Offers"];
const categories = ["Customize", "Sides", "Drinks", "Desserts", "Combos"];
const locations = ["Home - 2nd Main Road", "Office - Tidel Park", "Hostel - Block C"];
const banners = [
    {
        id: "b1",
        tag: "50% OFF up to Rs100",
        title: "Build your custom pizza in 3 mins",
        description: "Fresh dough, premium toppings, blazing fast delivery.",
    },
    {
        id: "b2",
        tag: "FREE DELIVERY",
        title: "Weekend combo specials",
        description: "Add drinks and sides to save more on every order.",
    },
    {
        id: "b3",
        tag: "BUY 1 GET 1",
        title: "Late night cravings sorted",
        description: "Hot pizzas delivered till midnight across your area.",
    },
];

const UserIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
);

const BellIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10.5 20a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
);

const PinIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
            d="M12 13.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
            stroke="currentColor"
            strokeWidth="1.8"
        />
        <path
            d="M18.4 10.3c0 5.5-6.4 10.8-6.4 10.8s-6.4-5.3-6.4-10.8a6.4 6.4 0 1 1 12.8 0Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
        />
    </svg>
);

const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
        <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
);

const MicIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M6 11a6 6 0 1 0 12 0" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 17v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
);

const OvenRushHomeChrome = () => {
    const [activeCategory, setActiveCategory] = useState(categories[0]);
    const [activeFilters, setActiveFilters] = useState([filters[0]]);
    const [activeBannerIndex, setActiveBannerIndex] = useState(0);
    const [searchText, setSearchText] = useState("");
    const [selectedLocation, setSelectedLocation] = useState(locations[0]);
    const [showLocations, setShowLocations] = useState(false);
    const [infoMessage, setInfoMessage] = useState("Showing popular custom pizza picks");

    useEffect(() => {
        const intervalId = setInterval(() => {
            setActiveBannerIndex((prev) => (prev + 1) % banners.length);
        }, 3500);

        return () => clearInterval(intervalId);
    }, []);

    const activeBanner = useMemo(() => banners[activeBannerIndex], [activeBannerIndex]);

    const toggleFilter = (filter) => {
        setActiveFilters((prev) => {
            const exists = prev.includes(filter);
            const next = exists ? prev.filter((item) => item !== filter) : [...prev, filter];
            return next.length ? next : [filters[0]];
        });
    };

    const handleCategoryClick = (category) => {
        setActiveCategory(category);
        setInfoMessage(`Browsing ${category.toLowerCase()} options`);
    };

    const handleMicClick = () => {
        setInfoMessage("Voice search preview: say 'paneer pizza under 300'");
    };

    const handleProfileClick = () => {
        setInfoMessage("Profile panel will open here");
    };

    const handleOffersClick = () => {
        setInfoMessage("Offers panel will open here");
    };

    return (
        <section className="or-home-shell">
            <header className="or-topbar">
                <button
                    type="button"
                    className="or-location"
                    onClick={() => setShowLocations((prev) => !prev)}
                    aria-expanded={showLocations}
                >
                    <span className="or-location-icon"><PinIcon /></span>
                    <span>
                        <span className="or-location-label">Delivery to</span>
                        <strong>{selectedLocation}</strong>
                    </span>
                </button>
                <div className="or-topbar-actions">
                    <button type="button" className="or-icon-btn" aria-label="Profile" onClick={handleProfileClick}>
                        <UserIcon />
                    </button>
                    <button type="button" className="or-icon-btn" aria-label="Offers" onClick={handleOffersClick}>
                        <BellIcon />
                    </button>
                </div>
            </header>

            {showLocations && (
                <div className="or-location-sheet">
                    {locations.map((location) => (
                        <button
                            type="button"
                            key={location}
                            className={`or-location-option ${selectedLocation === location ? "is-active" : ""}`}
                            onClick={() => {
                                setSelectedLocation(location);
                                setInfoMessage(`Location switched to ${location}`);
                                setShowLocations(false);
                            }}
                        >
                            {location}
                        </button>
                    ))}
                </div>
            )}

            <div className="or-search-wrap">
                <div className="or-search-box">
                    <span className="or-search-icon"><SearchIcon /></span>
                    <input
                        className="or-search"
                        type="text"
                        placeholder="Search for pizzas, toppings..."
                        value={searchText}
                        onChange={(event) => {
                            setSearchText(event.target.value);
                            setInfoMessage(event.target.value ? `Searching for '${event.target.value}'` : "Search cleared");
                        }}
                    />
                    <button type="button" className="or-mic-btn" aria-label="Voice search" onClick={handleMicClick}>
                        <MicIcon />
                    </button>
                </div>
            </div>

            <div className="or-carousel">
                <article className="or-banner">
                    <span className="or-tag">{activeBanner.tag}</span>
                    <h3>{activeBanner.title}</h3>
                    <p>{activeBanner.description}</p>
                </article>
                <div className="or-carousel-footer">
                    <span className="or-carousel-count">
                        {activeBannerIndex + 1} / {banners.length}
                    </span>
                    <div className="or-carousel-dots" role="tablist" aria-label="Banner selector">
                        {banners.map((banner, index) => (
                            <button
                                key={banner.id}
                                type="button"
                                className={`or-dot ${index === activeBannerIndex ? "is-active" : ""}`}
                                onClick={() => setActiveBannerIndex(index)}
                                aria-label={`Show banner ${index + 1}`}
                                aria-selected={index === activeBannerIndex}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="or-categories" role="tablist" aria-label="Categories">
                {categories.map((category, index) => (
                    <button
                        key={category}
                        type="button"
                        className={`or-category-pill ${activeCategory === category ? "is-active" : ""}`}
                        onClick={() => handleCategoryClick(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>

            <div className="or-filters" role="tablist" aria-label="Quick filters">
                {filters.map((filter, index) => (
                    <button
                        key={filter}
                        type="button"
                        className={`or-filter-chip ${activeFilters.includes(filter) ? "is-active" : ""}`}
                        onClick={() => toggleFilter(filter)}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            <p className="or-helper-message">{infoMessage}</p>
        </section>
    );
};

export default OvenRushHomeChrome;
