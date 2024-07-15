/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { UiItemsProvider, StagePanelLocation, StagePanelSection, Widget } from "@itwin/appui-react";
import { ValidationResultsWidget } from "./widgets/ValidationResultsWidget";
import { ValidationTestWidget } from "./widgets/ValidationTestWidget";

// Provides custom widgets to support validation workflow.
export class ValidationUiItemsProvider implements UiItemsProvider {
  public readonly id = "ValidationUiProvider";

  public provideWidgets(stageId: string, _stageUsage: string, location: StagePanelLocation, _section?: StagePanelSection | undefined): ReadonlyArray<Widget> {
    const widgets: Widget[] = [];

    // Widget to create and run validation tests (on right panel).
    if(location === StagePanelLocation.Right) {

      const testWidget: Widget = {
        id: "runValidationTests",
        label: "Validate Campus",
        content: <ValidationTestWidget />
      };

      widgets.push(testWidget);
    }

    // Widget to view validation results: Table and element colorization (on bottom panel).
    if (location === StagePanelLocation.Bottom) {

      const widget: Widget = {
        id: "viewValidationResults",
        label: "Validation Results",
        content: <ValidationResultsWidget />
      };

      widgets.push(widget);
    }

    return widgets;
  }
}
