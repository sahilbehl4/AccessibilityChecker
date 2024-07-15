import { ResponseFromGetResult } from "@itwin/property-validation-client";
import React, { Dispatch, SetStateAction, useState } from "react";

type StateTuple<S> = [S, Dispatch<SetStateAction<S>>];

interface GenericStateProviderProps {
  children: React.ReactNode;
}

interface GenericStateContextType {
  validationState?: StateTuple<ResponseFromGetResult | undefined>;
}

const GenericStateContext = React.createContext<GenericStateContextType>({
  validationState: undefined,
});

export const GenericStateProvider = ({
  children,
}: GenericStateProviderProps) => {
  const state = {
    validationState: useState<ResponseFromGetResult | undefined>(),
  };

  return (
    <GenericStateContext.Provider value={state}>
      {children}
    </GenericStateContext.Provider>
  );
};

export const useGenericState = () => {
  const context = React.useContext(GenericStateContext);
  if (context === undefined) {
    throw new Error(
      "useGenericState must be used within a GenericStateContext"
    );
  }
  return context;
};

export const useGetValidationState = () => {
  const { validationState } = React.useContext(GenericStateContext);
  if (validationState === undefined) {
    throw new Error(
      "useValidationState must be used within a GenericStateContext"
    );
  }
  return validationState[0]!;
};


export const useSetValidationState = () => {
  const { validationState } = React.useContext(GenericStateContext);
  if (validationState === undefined) {
    throw new Error(
      "useSetValidationState must be used within a GenericStateContext"
    );
  }
  return validationState[1]!;
};