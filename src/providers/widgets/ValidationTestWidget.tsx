/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Modal, Button, Input, Table, ProgressRadial } from "@itwin/itwinui-react";
import React, { useCallback, useMemo } from "react";
import ValidationLink from "../../ValidationLink";
import { ValidationRuleTable } from "./ValidationRuleTable";
import { formatRelative } from "date-fns";
import { NewRuleComponent } from "./NewRuleComponent";
import { ResponseFromGetResult, RuleDetails } from "@itwin/property-validation-client";
import "./ui.css";
import { useSetValidationState } from "../../StateProvider";

// Widget for creating and running tests. Also presents modal for creating new rules.
export function ValidationTestWidget() {
  // table data containing list of tests and runs.
  const [testData, setTestData] = React.useState<any[]>([]);
  // table data containing list of rules.
  const [ruleList, setRuleList] = React.useState<RuleDetails[]>([]);
  // test name when creating new test.
  const [testName, setTestName] = React.useState<string>("");
  // list of currently selected rules for creating new test.
  const [selectedRuleIds, setSelectedRuleIds] = React.useState<string[]>([]);
  // state variable for displaying "New Test" modal.
  const [showNewTestModal, setShowNewTestModal] = React.useState<boolean>(false);
  // state variable for displaying "New Rule" modal.
  const [addNewRule, setAddNewRule] = React.useState<boolean>(false);
  // app context callback for setting result.
  const setResultData = useSetValidationState();

  // columns for Test table component.
  const columns = useMemo(
    () => [
      {
        Header: "Tests",
        columns: [
          {
            // "displayName" column to show display name of test/run.
            id: "displayName",
            Header: "",
            accessor: "displayName",
          },
          {
            // "action" column to add click actions next to test/run.
            id: "action",
            Header: "",
            accessor: "action",
            maxWidth: 75,
          },
        ],
      },
    ],
    []
  );

  // Component initialization. Fetch latest validation data.
  React.useEffect(() => {
    fetchValidationTests().catch(console.error);
    fetchValidationRules().catch(console.error);
  }, []);

  // Method to fetch latest test (and run) data...and prepare it for table component.
  const fetchValidationTests = async () => {
    // fetch list of tests and runs using validation API.
    const testData: any[] = await ValidationLink.getTests();
    const runs: any[] = await ValidationLink.getRuns();

    // sort tests by date.
    testData.sort((a: any, b: any) => {
      return Date.parse(b.creationDateTime) - Date.parse(a.creationDateTime);
    });

    // sort runs by date.
    runs.sort((a: any, b: any) => {
      return Date.parse(b.executedDateTime) - Date.parse(a.executedDateTime);
    });

    // maintain a list of runs that are not yet "completed".
    const pendingRuns = [];

    for (const run of runs) {
      for (const index in testData) {
        if ((run._links.test.href as string).includes(testData[index].id)) {
          if (!testData[index].subRows) testData[index].subRows = [];
          // add each run under the test it belongs to (in the form of subrow property: to create expandable subrows within table).
          testData[index].subRows.push(run);
          if (run.status !== "completed")
            // if a run is not complete, add to pendingRun list.
            pendingRuns.push(testData[index].id);
        }
      }

      // for the "displayName" of the run use execution date and time.
      run.displayName = formatRelative(
        Date.parse(run.executedDateTime),
        Date.now()
      );
      if (run.status === "completed")
        // if run completed, add View button as the "action" column entry (to view its results).
        run.action = (
          <Button
            size="small"
            onClick={(_event) => {
              updateValidationResults(run.resultId);
            }}
          >
            View
          </Button>
        );
    }

    for (const test of testData) {
      // If test contains pending run, add ProgressRadial as the "action" column entry to show progress.
      if (pendingRuns.includes(test.id))
        test.action = <ProgressRadial indeterminate size="small" />;
      // Else add run "▶" button as the "action" column entry.
      else
        test.action = (
          <Button
            id={test.id}
            size="small"
            onClick={(_event) => {
              // when the button is clicked, run validation test using API.
              runValidationTest(test.id);
              const button = document.getElementById(test.id);
              // hide ▶ button after it's clicked (to avoid multiple runs).
              if (button) button.style.display = "none";
            }}
          >
            ▶
          </Button>
        );
    }
    setTestData(testData);

    // if any pendingRuns exist, re-run this method after 5 seconds to get latest data.
    if (pendingRuns.length > 0) setTimeout(fetchValidationTests, 5000);
  };

  // Fetch validation results. Entry-point into ValidationResultsWidget
  const updateValidationResults = useCallback(
    async (resultId: string) => {
      const resultData: ResponseFromGetResult = await ValidationLink.getResult(
        resultId
      );
      console.log("updateValidationResults")
      console.log(resultData)
      // set resultData on app context.
      if (setResultData) setResultData(resultData);
    },
    [setResultData]
  );

  // Run validation test, and fetch latest data for run status.
  const runValidationTest = async (testId: string) => {
    await ValidationLink.runTest(testId);
    fetchValidationTests();
  };

  // Fetch validation rules and sort by creation date.
  const fetchValidationRules = async () => {
    const ruleData: RuleDetails[] = await ValidationLink.getRules();

    // console.log(ruleData)

    // const rules: RuleDetails[] = ruleData.filter(
    //   (rule: RuleDetails) => rule.functionName === "PropertyValueRange"
    // );
    ruleData.sort((a: RuleDetails, b: RuleDetails) => {
      return Date.parse(b.creationDateTime) - Date.parse(a.creationDateTime);
    });

    setRuleList(ruleData);
  };

  // Create new test.
  const createTest = async () => {
    console.log(testName)
    console.log(selectedRuleIds)
    const test = await ValidationLink.createTest(
      testName,
      testName,
      selectedRuleIds
    );
    if (test) {
      // fetch latest test data if test is successfully created (to update table component).
      fetchValidationTests();
      // close out "New Test" modal.
      setShowNewTestModal(false);
    }
  };

  // New Rule added. Fetch latest rule data.
  const ruleAdded = async () => {
    fetchValidationRules();
    setAddNewRule(false);
  };

  // If testData (which includes tests and runs) is ready, display table component.
  const table = testData ? (
    <Table
      columns={columns}
      data={testData}
      emptyTableContent="No Tests"
      isSelectable={false}
      density="extra-condensed"
      autoResetExpanded={false}
      autoResetPage={false}
    />
  ) : (
    "No Tests"
  );

  let modalContents, modalTitle;

  // if addNewRule state variable is true, display contents to create "New Rule" modal.
  if (addNewRule) {
    modalTitle = "Create New Rule";
    modalContents = (
      <>
        <NewRuleComponent ruleAdded={ruleAdded} />
      </>
    );
  } else {
    // else display contents to create "New Test" modal.
    modalContents = (
      <div className="new-test-modal">
        <div style={{ display: "flex", gap: 8 }}>
          <Input id="testName" onInput={(event) => {setTestName(event.currentTarget.value)}} placeholder="Test Name" />
        </div>
        {/* Includes ValidationRuleSelector component to select rule Ids */}
        <ValidationRuleTable
          ruleList={ruleList}
          rulesSelected={(ruleIds: string[]) => setSelectedRuleIds(ruleIds)}
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "end" }}>
          <Button onClick={() => setAddNewRule(true)}>Add Rule</Button>
          <Button styleType="high-visibility" onClick={createTest}>
            Create
          </Button>
        </div>
      </div>
    );
  }

  // Render output
  return (
    <>
      {/* "Create Test" button */}
      <Button
        className="custom-button"
        styleType="default"
        size="small"
        onClick={() => setShowNewTestModal(true)}
      >
        Create Test
      </Button>
      {/* Tests/runs table */}
      {table}
      {/* "New Test" or "New Rule" modal if needed. */}
      <Modal
        isOpen={showNewTestModal}
        title={modalTitle}
        style={!addNewRule ? { minWidth: "550px" } : {}}
        onClose={() => {
          addNewRule ? setAddNewRule(false) : setShowNewTestModal(false);
        }}
      >
        {modalContents}
      </Modal>
    </>
  );
}
