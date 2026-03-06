import { toolRegistry } from "./registry";
import { webSearchTool } from "./definitions/web-search";
import { weatherTool } from "./definitions/weather";
import { stockTool } from "./definitions/stock";
import { timeTool } from "./definitions/time";
import { readUrlTool } from "./definitions/read-url";

// Register all tools - extract definition and execute from Tool objects
toolRegistry.register({ ...webSearchTool.definition, execute: webSearchTool.execute });
toolRegistry.register({ ...weatherTool.definition, execute: weatherTool.execute });
toolRegistry.register({ ...stockTool.definition, execute: stockTool.execute });
toolRegistry.register({ ...timeTool.definition, execute: timeTool.execute });
toolRegistry.register({ ...readUrlTool.definition, execute: readUrlTool.execute });

export { toolRegistry };
