import React from "react";
import { usePizzaBuilder } from "../../context/PizzaBuilderContext";

const CheeseStep = () => {
    const { pizzaData, updatePizza, options, isOptionsLoading } = usePizzaBuilder();

    if (isOptionsLoading) {
        return <section><h2>Step 3: Choose Cheese</h2><p>Loading options...</p></section>;
    }

    return (
        <section>
            <h2>Step 3: Choose Cheese</h2>
            {options.cheese.map((cheeseItem) => (
                <label key={cheeseItem.name} className="option-row">
                    <input
                        type="radio"
                        name="cheese"
                        value={cheeseItem.name}
                        checked={pizzaData.cheese === cheeseItem.name}
                        onChange={(event) => updatePizza("cheese", event.target.value)}
                    />
                    <span>{cheeseItem.name}</span>
                </label>
            ))}
        </section>
    );
};

export default CheeseStep;
