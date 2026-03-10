import React from "react";
import { useEffect } from "react";
import BaseStep from "./steps/BaseStep";
import SauceStep from "./steps/SauceStep";
import CheeseStep from "./steps/CheeseStep";
import VeggieStep from "./steps/VeggieStep";
import SummaryStep from "./steps/SummaryStep";
import { usePizzaBuilder } from "../context/PizzaBuilderContext";

const PizzaBuilder = () => {
    const { currentStep, pizzaData, nextStep, prevStep, loadOptions } = usePizzaBuilder();

    useEffect(() => {
        loadOptions().catch((error) => {
            alert(error.message || "Failed to load inventory");
        });
    }, [loadOptions]);

    const stepComponentMap = {
        1: <BaseStep />,
        2: <SauceStep />,
        3: <CheeseStep />,
        4: <VeggieStep />,
        5: <SummaryStep />,
    };

    const canMoveForward = () => {
        if (currentStep === 1) return Boolean(pizzaData.base);
        if (currentStep === 2) return Boolean(pizzaData.sauce);
        if (currentStep === 3) return Boolean(pizzaData.cheese);
        return true;
    };

    return (
        <main className="builder-shell">
            <h1>Build Your Pizza</h1>
            <p>Step {currentStep} of 5</p>

            <div className="step-card">{stepComponentMap[currentStep]}</div>

            <div className="step-actions">
                {currentStep > 1 && (
                    <button type="button" onClick={prevStep}>
                        Back
                    </button>
                )}
                {currentStep < 5 && (
                    <button type="button" onClick={nextStep} disabled={!canMoveForward()}>
                        Next
                    </button>
                )}
            </div>
        </main>
    );
};

export default PizzaBuilder;
