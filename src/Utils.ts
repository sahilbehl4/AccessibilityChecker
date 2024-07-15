/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { IModelApp } from "@itwin/core-frontend";
import { UnitConversionProps } from "@itwin/core-quantity";
import { SchemaUnitProvider } from "@itwin/ecschema-metadata";
import { ECSchemaRpcLocater } from "@itwin/ecschema-rpcinterface-common";

export default class Utils {

    // variable to cache quantity conversions.
    private static conversions: {[index: string]: UnitConversionProps} = {};

    // iModel quantity formatter to convert units.
    public static async convertQuantity(quantity: number, sourceUnit: string, targetUnit: string) {
        let newQuantity;
        let conversion: UnitConversionProps;
        // signature to identify a particular quantity conversion.
        const conversionSignature = sourceUnit + "_" + targetUnit;

        // if conversion already cached, use local value.
        if (Utils.conversions[conversionSignature]) {
            conversion = Utils.conversions[conversionSignature];
        } else {
            const imodel = IModelApp.viewManager.selectedView?.iModel;
            if (!imodel) throw new Error("iModel not loaded! Cannot perform unit conversion.");
            const schemaLocater = new ECSchemaRpcLocater(imodel); // requires ECSchemaRpcInterface (see App.tsx)
            const formatter = IModelApp.quantityFormatter;
            await formatter.setUnitsProvider(new SchemaUnitProvider(schemaLocater));
            const fromUnit = await formatter.findUnitByName(`Units.${sourceUnit}`);
            const toUnit = await formatter.findUnitByName(`Units.${targetUnit}`);
            conversion = await formatter.getConversion(fromUnit, toUnit);
            // cache conversion for future use.
            Utils.conversions[conversionSignature] = conversion;
        }

        newQuantity = conversion.factor * quantity + conversion.offset;
        
        return newQuantity;
    }

}