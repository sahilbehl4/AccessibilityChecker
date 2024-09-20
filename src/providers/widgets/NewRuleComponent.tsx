/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Button, Input, MenuItem, Select } from "@itwin/itwinui-react";
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
    { label: "Door Width", value: "0x2000000005d" },
  ];

  // method called when "Create" button is pressed.
  const createRule = async () => {
    console.log("Create rule:")
    console.log(material)
    const materialEntry = materialOptions.filter(
      (entry: any) => entry.value === material?.value
    );

    if(material?.label == "Door Width") {
      setTempHigh(Number.parseFloat("99999"));
    }

    console.log(materialEntry)
    let description = `${tempLow} - ${tempHigh}`
    console.log(description)

    if (materialEntry.length > 0) {
      const rule = await ValidationLink.createValidationRule(
        materialEntry[0].label,
        description,
        materialEntry[0].value
      );
      if (rule) ruleAdded();
    }
  };

  // render output
  return (
    <>
      <div style={{ marginTop: "30px" }}>
          <Select<any>
              options={materialOptions}
              value={material?.value}
              placeholder="Rule Type"
              itemRenderer={(option, itemProps) => (
                <MenuItem
                  // style={{ color: option.value }}
                  isSelected={itemProps.isSelected}
                  onClick={() => {
                    console.log(option.label)
                    setMaterial({label: option.label, value: option.value});
                    setTempLow(0);
                    setTempHigh(0);
                    // setSelectedValue(option.value);
                    itemProps.close();
                  }}
                  role='option'
                  ref={(el) => itemProps.isSelected && el?.scrollIntoView()}
                >
                  {option.label}
                </MenuItem>
              )}
              selectedItemRenderer={(option) => (
                <span style={{ backgroundColor: option.value }}>{option.label}</span>
              )}
          />
      </div>
            <div style={{ marginTop: "20px" }}>
              { material?.label == "Door Width" ? "Value Range (in mm)" : "Value Range (in °)" }:
              <br />

              <Input
                type="number"
                disabled={false}
                value={tempLow}
                min={0}
                max={99999}
                step={material?.label == "Door Width" ? 100 : 0.5}
                style={{ width: "20vh" }}
                placeholder={"Low"}
                onChange={ (event: any) => {
                  setTempLow(Number.parseFloat(event.target.value))
                  setTempHigh(material?.label == "Door Width" ? Number.parseFloat("99999") : tempHigh);
                }  
                 }
              />
              {" - "}
              <Input
                type="number"
                disabled={material?.label == "Door Width"}
                value={ material?.label == "Door Width" ? "99999" : tempHigh }
                min={0}
                max={99999}
                step={material?.label == "Door Width" ? 100 : 0.5}
                style={{ width: "20vh" }}
                placeholder={"High"}
                onChange={ (event: any) => setTempHigh(Number.parseFloat(event.target.value)) }
              />
            </div>

      <Button
        styleType="high-visibility"
        onClick={createRule}
        disabled={!material || tempLow >= tempHigh || tempLow <= 0}
        style={{ float: "right", marginTop: "20px" }}
      >
        Create
      </Button>

    </>
  );
};
