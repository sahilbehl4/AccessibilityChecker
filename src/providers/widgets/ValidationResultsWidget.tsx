/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import React, { useMemo } from "react";
import { Table } from "@itwin/itwinui-react";
import ValidationLink from "../../ValidationLink";
import { ITwinLink, Pipeline } from "../../iTwinLink";
import { EmphasizeElements, IModelApp } from "@itwin/core-frontend";
import { ColorDef, ElementProps } from "@itwin/core-common";
import { ResponseFromGetResult, RuleDetails } from "@itwin/property-validation-client";
import Utils from "../../Utils";
import { useGetValidationState } from "../../StateProvider";

interface ValidationData extends ResponseFromGetResult {
  ruleData: { [key: string]: RuleDetails };
}

// Widget for presenting validation results (in a table) and colorizing result elements.
export function ValidationResultsWidget() {
  // validation result data
  const [validationData, setValidationData] = React.useState<ValidationData>();
  // validation result data prepared for table component.
  const [tableData, setTableData] = React.useState<any>();
  // pipelines that failed validation test.
  const [pipelines, setPipelines] = React.useState<Pipeline[]>();
  // app context state variable for storing latest result.
  const result = useGetValidationState();

  //fetch list of all pipelines from iModel.
  React.useEffect(() => {
    const vp = IModelApp.viewManager.selectedView;
    if (vp)
      ITwinLink.getPipelines(vp.iModel).then((pipelines: Pipeline[]) =>
        setPipelines(pipelines)
      );
  }, []);

  // columns for result table.
  const columns = useMemo(
    () => [
      {
        Header: "Table",
        columns: [
          {
            id: "validationType",
            Header: "Validation Type",
            accessor: "validationType",
          },
          {
            id: "allowedRange",
            Header: "Allowed Range",
            accessor: "allowedRange",
          },
          {
            id: "objectId",
            Header: "Physical Object Id",
            accessor: "objectId",
          },
          {
            id: "badValue",
            Header: "Value",
            accessor: "badValue",
          },
          {
            id: "result",
            Header: "Result",
            accessor: "result",
          }
        ],
      },
    ],
    []
  );

  // prepare validation result data for table, and colorize pipeline elements (with issues).
  React.useEffect(() => {
    if (!validationData) return;
    const prepareTableData = async () => {
      const data = [];
      // keep track of elements related to cost (excessive material) and safety (insufficient material) issues.
      let costElements: string[] = [];
      let safetyElements: string[] = [];

      for (const result of validationData.result) {
        // get RuleData and target pipeline for each result.
        console.log("Result")
        console.log(result)
        const ruleIndex: number = Number.parseInt(result.ruleIndex);
        const ruleId = validationData.ruleList[ruleIndex].id;
        const ruleData = validationData.ruleData[ruleId];
        const pipeline = pipelines?.find(
          (pipeline) => pipeline.id === result.elementId
        );
        let issue = "";

        if (pipeline && ruleData && ruleData.functionParameters.lowerBound) {
          // if bad value less than lower bound number, tag issue as "Insulation too low". Add pipe elements to safety issue list.
          if (result.badValue < ruleData.functionParameters.lowerBound) {
            safetyElements = safetyElements.concat(pipeline.pipes);
            issue = "Insulation too low";
          }
          // else tag issue as "Insulation too high". Add pipe elements to cost issue list.
          else {
            costElements = costElements.concat(pipeline.pipes);
            issue = "Insulation too high";
          }
        }
        // parse out JSON rule details from rule data.
        // const ruleDetails = JSON.parse(ruleData.description);
        // let material = "unspecified";

        let validationType = ruleData.displayName;
        let objectId = ruleData.functionParameters.pattern ??= `nil`

        let allowedRange = ruleData.description

        // make rule details presentable for table output.
        // if (ruleDetails.material && ruleDetails.material.label)
        //   material = ruleDetails.material.label;
        // const temperature = `${ruleDetails.tempLow} °F  - ${ruleDetails.tempHigh} °F`;
        // const insulation = `${ruleDetails.insulationLow} inch - ${ruleDetails.insulationHigh} inch`;
        const badValue = "30"
        let range = extractNumbers(allowedRange)
        console.log(range)
        let badValueNumber = parseFloat(badValue);
        console.log(badValueNumber)
        let finalResult = (badValueNumber >= range[0] && badValueNumber <= range[1])
        console.log(badValueNumber >= range[0])
        console.log(badValueNumber <= range[1])

        // push result entry into table data.
        data.push({
          validationType,
          allowedRange,
          objectId: finalResult ? "-" : objectId,
          badValue: finalResult ? "-" : badValue + "°",
          result: finalResult ? "Pass" : "Fail"
        });
      }

      // clear (any) previous colorization, and color cost/safety issue elements as blue/red respectively.
      const vp = IModelApp.viewManager.selectedView!;
      const emph = EmphasizeElements.getOrCreate(vp);
      emph.clearOverriddenElements(vp);
      emph.clearEmphasizedElements(vp);
      emph.overrideElements(costElements, vp, ColorDef.blue);
      emph.emphasizeElements(costElements, vp, undefined, true);
      emph.overrideElements(safetyElements, vp, ColorDef.red);
      emph.emphasizeElements(costElements, vp, undefined, false);

      // set table final data.
      setTableData(data);
    };
    prepareTableData();
  }, [validationData, pipelines]);

  // method to parse result when updated on app context.
  React.useEffect(() => {
    const parseResult = async (resultData: ResponseFromGetResult) => {
      const validationData: any = resultData;
      const ruleData: any = [];
      // fetch rule data to add to result data.
      const rules: RuleDetails[] = await ValidationLink.getRules();
      for (const rule of resultData.ruleList) {
        const data: RuleDetails = rules.filter(
          (ruleDetails: RuleDetails) => ruleDetails.id === rule.id
        )[0];
        ruleData[rule.id] = data;
      }
      validationData.ruleData = ruleData;
      setValidationData(validationData);
    };
    if (result) parseResult(result);
  }, [result]);

  function extractNumbers(input: string): number[] {
    // Define a regular expression to match numbers
    const regex = /\d+/g;
    
    // Extract numbers from the input string
    const numbers = input.match(regex);
    
    // Convert the matched strings to numbers and return
    if (numbers) {
        return numbers.map(numStr => parseInt(numStr, 10));
    } else {
        return [];
    }
}

  // when table row clicked, zoom into pipeline with issue.
  const onRowClicked = async (_rows: any, state: any) => {
    const vp = IModelApp.viewManager.selectedView!;
    const pipelineId = validationData?.result[state.id].elementId;
    const pipeline = pipelines?.find((pipeline) => pipeline.id === pipelineId);
    // if (pipeline) {

    // const params: ElementProps = {

    // }

    // ramp: 0x20000000056
    console.log(state)
    console.log(state.allCells[2].value)

    // if(state.allCells[4].value == "Fail") {
      let id = state.allCells[2].value
      vp.zoomToElements(id, { animateFrustumChange: true });
      vp.iModel.selectionSet.replace(id);
    // }


    // }
  };

  // If tableData available, prepare table UI component.
  const table = tableData ? (
    <Table
      columns={columns}
      data={tableData}
      emptyTableContent="No Issues."
      isSelectable={false}
      onRowClick={onRowClicked}
      density="extra-condensed"
    />
  ) : (
    "No Data"
  );

  return <>{table}</>;
}
