import React from "react";
import { usePizzaBuilder } from "../../context/PizzaBuilderContext";

const VeggieStep = () => {
    const { pizzaData, updatePizza, options, isOptionsLoading } = usePizzaBuilder();

    if (isOptionsLoading) {
        return <section><h2>Step 4: Choose Veggies</h2><p>Loading options...</p></section>;
    }

    const toggleVeggie = (veggie) => {
        const exists = pizzaData.veggies.includes(veggie);
        const updatedVeggies = exists
            ? pizzaData.veggies.filter((item) => item !== veggie)
            : [...pizzaData.veggies, veggie];

        updatePizza("veggies", updatedVeggies);
    };

    return (
        <section>
            <h2>Step 4: Choose Veggies</h2>
            {options.veggie.map((veggieItem) => (
                <label key={veggieItem.name} className="option-row">
                    <input
                        type="checkbox"
                        value={veggieItem.name}
                        checked={pizzaData.veggies.includes(veggieItem.name)}
                        onChange={() => toggleVeggie(veggieItem.name)}
                    />
                    <span>{veggieItem.name}</span>
                </label>
            ))}
        </section>
    );
};

export default VeggieStep;
