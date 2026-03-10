import React from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getInventory, seedInventory } from "../services/inventoryService";

const PizzaBuilderContext = createContext(null);

export const PizzaBuilderProvider = ({ children }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [pizzaData, setPizzaData] = useState({
        base: "",
        sauce: "",
        cheese: "",
        veggies: [],
    });
    const [options, setOptions] = useState({
        base: [],
        sauce: [],
        cheese: [],
        veggie: [],
        meat: [],
    });
    const [isOptionsLoading, setIsOptionsLoading] = useState(false);

    const updatePizza = (key, value) => {
        setPizzaData((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const nextStep = () => {
        setCurrentStep((prev) => Math.min(prev + 1, 5));
    };

    const prevStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    const loadOptions = useCallback(async () => {
        setIsOptionsLoading(true);
        try {
            await seedInventory();
            const inventory = await getInventory();
            setOptions(inventory);
        } finally {
            setIsOptionsLoading(false);
        }
    }, []);

    const value = useMemo(
        () => ({
            currentStep,
            pizzaData,
            options,
            isOptionsLoading,
            updatePizza,
            nextStep,
            prevStep,
            loadOptions,
        }),
        [currentStep, pizzaData, options, isOptionsLoading]
    );

    return <PizzaBuilderContext.Provider value={value}>{children}</PizzaBuilderContext.Provider>;
};

export const usePizzaBuilder = () => {
    const context = useContext(PizzaBuilderContext);

    if (!context) {
        throw new Error("usePizzaBuilder must be used within PizzaBuilderProvider");
    }

    return context;
};
