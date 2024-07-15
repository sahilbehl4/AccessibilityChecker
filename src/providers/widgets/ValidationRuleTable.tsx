/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Table } from "@itwin/itwinui-react";
import { RuleDetails } from "@itwin/property-validation-client";
import React, { useMemo } from "react";

// Component that lists validations rules to support test creation.
export const ValidationRuleTable: React.FC<{ ruleList: RuleDetails[], rulesSelected: (ruleIds: string[]) => void }> = ({ ruleList, rulesSelected }) => {

  const [tableData, setTableData] = React.useState<any[]>([]);

  // when new rule is selected, pass ruleIds (back to parent) using "rulesSelected" callback prop.
  const onSelect = (_rows: any, state: any) => {
    const ruleIds = [];

    for (const index in state.selectedRowIds) {
      const ruleId = ruleList[Number.parseInt(index)].id;
      ruleIds.push(ruleId);
    }

    rulesSelected(ruleIds);
  };

  // columns for presenting rule list
  const columns = useMemo(
    () => [
      {
        Header: "Table",
        columns: [
          {
            id: "criteria",
            Header: "Criteria",
            accessor: "criteria",
          },
          {
            id: "range",
            Header: "Range",
            accessor: "range",
          },
        ],
      },
    ],
    []
  );

  // Set table data using latest ruleList (from props).
  React.useEffect(() => {
    const data = [];

    console.log("rule list")
    console.log(ruleList)

    for (const rule of ruleList) {
      let criteria = rule.displayName;

      data.push({
        criteria,
        range: rule.description,
      });
    }

    setTableData(data);
  }, [ruleList]);

  return (
    <Table
      columns={columns}
      data={tableData}
      emptyTableContent="No Rules"
      isSelectable={true}
      onSelect={onSelect}
      style={{ minHeight: 0 }}
      enableVirtualization
    />
  );
};
