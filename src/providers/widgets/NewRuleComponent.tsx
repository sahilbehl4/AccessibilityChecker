/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Button, Input, Select } from "@itwin/itwinui-react";
import React from "react";
import ValidationLink from "../../ValidationLink";

// Component to gather user inputs and create rules for validating pipe insulation.
export const NewRuleComponent: React.FC<{ruleAdded: () => {}}> = ({ ruleAdded }) => {

  // state variables for input fields.
  const [tempLow, setTempLow] = React.useState<number>(0);
  const [tempHigh, setTempHigh] = React.useState<number>(0);
  const [material, setMaterial] = React.useState<
    | {
        label: string;
        value: string;
      }
    | undefined
  >();

  // list of insulation materials along with their iModel values.
  const materialOptions = [
    { label: "Ramp Slope", value: "0x20000000056" },
    { label: "Door Width", value: "0x20000000053" },
  ];

  // method called when "Create" button is pressed.
  const createRule = async () => {
    const materialEntry = materialOptions.filter(
      (entry: any) => entry.value === material
    );
    if (materialEntry.length > 0) {
      let description = `${tempLow} - ${tempHigh}`
      console.log(description)
      const rule = await ValidationLink.createValidationRule(
        materialEntry[0].label,
        description,
        materialEntry[0].value
      );
      if (rule) ruleAdded();
    }
  };

  // method to return input field.
  const getInput = (
    min: number,
    max: number,
    step: number,
    placeholder: string,
    onChange: (event: any) => void
  ) => {
    return (
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        style={{ width: "20vh" }}
        placeholder={placeholder}
        onChange={onChange}
      />
    );
  };

  // render output
  return (
    <>
      <div style={{ marginTop: "30px" }}>
        <Select<any>
          id="ruleType"
          options={materialOptions}
          placeholder="Rule Type"
          onChange={(material: { label: string; value: string }) => {
            setMaterial(material);
          }}
          value={material}
          style={{ width: "40vh" }}
        />
      </div>
      <div style={{ marginTop: "20px" }}>
        Value Range (in degrees):
        <br />
        {getInput(0, 1000, 0.5, "Low", (event: any) => {
          setTempLow(Number.parseFloat(event.target.value));
        })}
        {getInput(0, 1000, 0.5, "High", (event: any) => {
          setTempHigh(Number.parseFloat(event.target.value));
          console.log(`${tempLow} - ${tempHigh}`)
        })}
      </div>
      <Button
        styleType="high-visibility"
        onClick={createRule}
        style={{ float: "right", marginTop: "20px" }}
      >
        Create
      </Button>
    </>
  );
};
