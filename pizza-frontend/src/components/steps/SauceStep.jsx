import React from "react";
import { usePizzaBuilder } from "../../context/PizzaBuilderContext";

const SauceStep = () => {
    const { pizzaData, updatePizza, options, isOptionsLoading } = usePizzaBuilder();

    if (isOptionsLoading) {
        return <section><h2>Step 2: Choose Sauce</h2><p>Loading options...</p></section>;
    }

    return (
        <section>
            <h2>Step 2: Choose Sauce</h2>
            {options.sauce.map((sauceItem) => (
                <label key={sauceItem.name} className="option-row">
                    <input
                        type="radio"
                        name="sauce"
                        value={sauceItem.name}
                        checked={pizzaData.sauce === sauceItem.name}
                        onChange={(event) => updatePizza("sauce", event.target.value)}
                    />
                    <span>{sauceItem.name}</span>
                </label>
            ))}
        </section>
    );
};

export default SauceStep;
