import { IModelApp } from "@itwin/core-frontend";
import { PropertyValidationClient, ParamsToGetTemplateList, RuleTemplate, ParamsToCreateRule, ParamsToRunTest, Rule, ParamsToCreateTest, Test, Run, ParamsToGetRun, RunDetails, ParamsToGetResult, ResponseFromGetResult, ParamsToGetRuleList, RuleDetails, TestItem, ParamsToGetTestList, ParamsToGetRunList } from "@itwin/property-validation-client";

export default class ValidationLink {

    private static client = new PropertyValidationClient(undefined, () => ValidationLink.getAccessToken())

    public static async getAccessToken(): Promise<string> {
        return await IModelApp.authorizationClient?.getAccessToken()!
    }
        //  create rules templates

    public static async getTemplates() : Promise<RuleTemplate[]> {
        const params: ParamsToGetTemplateList = {
            urlParams: {
                projectId: process.env.IMJS_ITWIN_ID!
            }
        }

        const iterator = ValidationLink.client.templates.getList(params);
        const runTemplates = [];
        for await (const ruletemplate of iterator) {
            runTemplates.push(ruletemplate);
        }

        return runTemplates;
    }

    // update parameters
    public static async createValidationRule(ruleName: string, description: string, id: string): Promise<Rule> {

        const templates = await ValidationLink.getTemplates();
        console.log("templates")
        console.log(templates)
        const template = templates.filter((template) => template.id = "Mku6FdzlZUycVS7R8hYjJ2xnNSG7kiNHrAq4eYjYm-Q")[0]

        const params: ParamsToCreateRule = {
            /** Rule template id. */
            templateId: template.id,
             /** Rule display name. */
            displayName: ruleName,
            /** Rule description. */
            description: description,
            /** EC class of Rule. */
            ecClass: "PhysicalObject",
            /** EC schema of Rule. */
            ecSchema: "Generic",
            /** Where clause of Rule. */
            whereClause: "",
            /** Rule severity ('low', 'medium', 'high', 'veryHigh'). */
            severity: "high",
            /** Data type of Rule ('property', 'aspect', 'typeDefinition'). */
            dataType: "property",
            /** Rule function parameters. */
            functionParameters: {
                propertyName: "ECInstanceId",
                pattern: id
            },
        }

        return ValidationLink.client.rules.create(params);
    }

    // Get all rules for a given iTwin.
    public static async getRules(): Promise<RuleDetails[]> {
        const params: ParamsToGetRuleList = {
            urlParams: {
                projectId: process.env.IMJS_ITWIN_ID!
            },
        }

        const iterator = ValidationLink.client.rules.getRepresentationList(params);
        
        const rules = [];
        for await (const rule of iterator)
            rules.push(rule);

        return rules;
    }

    //  create tests

    public static async createTest(testName: string, description: string, rulesIds: string[]): Promise<Test> {
        console.log(testName)
        console.log(description)
        console.log(rulesIds)
        const params: ParamsToCreateTest = {
            /** Project id to associate with test. */
            projectId: process.env.IMJS_ITWIN_ID!,
            /** Test display name. */
            displayName: testName,
            /** Test description. */
            description: description,
            /** Stop execution on failure flag. */
            stopExecutionOnFailure: false,
            /** Array of rule ids to associate with test. */
            rules: rulesIds
        }

        return ValidationLink.client.tests.create(params);
    }

    // Get all tests for a given iTwin.
    public static async getTests(): Promise<TestItem[]> {
        const params: ParamsToGetTestList = {
            urlParams: {
                projectId: process.env.IMJS_ITWIN_ID!
            },
        }

        const iterator = ValidationLink.client.tests.getList(params);
        const tests = [];
        for await (const test of iterator)
            tests.push(test);
        
            console.log(tests)
        return tests;
    }

    //  create results

    public static async runTest(testId: string): Promise<Run | undefined> {
        const params: ParamsToRunTest = {
            /** Test id. */
            testId: testId,
            /** iModel id. */
            iModelId: process.env.IMJS_IMODEL_ID!
            /** Named version id. */
            /** Test settings. */
        }

        return ValidationLink.client.tests.runTest(params);
    }

    // Get all runs for a given iTwin.
    public static async getRuns(): Promise<RunDetails[]> {
        const params: ParamsToGetRunList = {
            urlParams: {
                projectId: process.env.IMJS_ITWIN_ID!
            },
        }

        const iterator = await ValidationLink.client.runs.getRepresentationList(params);
        const runs = [];
        for await (const run of iterator)
            runs.push(run);

        return runs;
    }

    public static async getRun(runId: string): Promise<RunDetails> {
        const params: ParamsToGetRun = {
            runId
        }

        return ValidationLink.client.runs.getSingle(params);
    }

    public static async getResult(resultId: string): Promise<ResponseFromGetResult> {
        const params: ParamsToGetResult = {
            resultId
        }

        return ValidationLink.client.results.get(params);
    }
}