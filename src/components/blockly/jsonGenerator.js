import Blockly from "blockly";

// 1) Create your generator
//    This ensures it inherits from the base Generator prototype.
const JSONGenerator = new Blockly.Generator("JSON");

// 2) Optionally override init(), finish(), etc.
JSONGenerator.init = function (workspace) {
  // Called before code generation. Do any setup you want here.
};

JSONGenerator.finish = function (code) {
  // Called after code generation.
  // 'code' will be the final string your generator created.
  // You can do post-processing, or just return it as-is.
  return code;
};

/**
 * By default, a statement block returns '' in text-based languages,
 * but we want each block to produce a chunk of JSON.
 * We'll store them in a global array, then combine them later.
 */

// We override this to produce code for "set_laser_power_block"
JSONGenerator["set_laser_power_block"] = function (block) {
  const power = block.getFieldValue("POWER");
  const channel = block.getFieldValue("CHANNEL");
  // You might generate a random or unique ID, but for now let's just use block.id
  const stepId = block.id;

  // Build a single step in your required shape
  const step = {
    id: stepId,
    stepName: "Set Laser Power",
    mainFuncName: "set_laser_power",
    mainParams: {
      power: parseFloat(power),
      channel: channel,
    },
    preFuncs: [],
    preParams: {},
    postFuncs: [],
    postParams: {},
  };

  // Return a JSON string. The aggregator will parse it later.
  return JSON.stringify(step) + ",";
};

// Similarly for the wait_time_block
JSONGenerator["wait_time_block"] = function (block) {
  const seconds = block.getFieldValue("SECONDS");
  const stepId = block.id;

  const step = {
    id: stepId,
    stepName: "Wait Time",
    mainFuncName: "wait_time",
    mainParams: {
      seconds: parseFloat(seconds),
    },
    preFuncs: [],
    preParams: {},
    postFuncs: [],
    postParams: {},
  };

  return JSON.stringify(step) + ",";
};

// For the acquire_frame_block
JSONGenerator["acquire_frame_block"] = function (block) {
  const channel = block.getFieldValue("CHANNEL");
  const stepId = block.id;

  const step = {
    id: stepId,
    stepName: "Acquire Frame",
    mainFuncName: "acquire_frame",
    mainParams: {
      channel: channel,
    },
    preFuncs: [],
    preParams: {},
    postFuncs: ["process_data", "save_frame_zarr"], // optional example
    postParams: {},
  };

  return JSON.stringify(step) + ",";
};

/*
Loop stuff
*/
// Define the blockToCode method
JSONGenerator.blockToCode = function (block) {
  if (!block) {
    return "";
  }
  const func = this[block.type];
  if (typeof func !== "function") {
    throw Error(
      "Language does not know how to generate code for block type: " +
        block.type
    );
  }
  const code = func.call(this, block);
  return code;
};
// 1) A helper to parse a chain of statement blocks and return a JSON string
//    We'll parse each block, parse the next block, etc. We return a string of comma-separated objects.
function parseStatementChain(generator, block) {
  let result = "";
  while (block) {
    let code = generator.blockToCode(block);
    result += code;
    // blockToCode might return multiple steps if it flattens an internal loop
    block = block.getNextBlock();
  }
  return result;
}

// 2) controls_repeat_ext flattening
JSONGenerator["controls_repeat_ext"] = function (block) {
  // The block has an input "TIMES" containing how many repetitions we want.
  let repeats = 0;
  const timesBlock = block.getInputTargetBlock("TIMES");
  if (timesBlock) {
    // We expect timesBlock to be e.g. a math_number block
    let timesCode = this.blockToCode(timesBlock);
    timesCode = timesCode.trim().replace(/,$/, "");
    repeats = parseInt(timesCode) || 0;
  }

  // The "DO" input is the statement body
  const bodyBlock = block.getInputTargetBlock("DO");
  if (!bodyBlock) {
    return ""; // no body = no steps
  }

  // We flatten by generating the body steps as a string once, then repeat
  // that string `repeats` times.
  let flattenedResult = "";
  for (let i = 0; i < repeats; i++) {
    // parseStatementChain will handle each statement in the chain
    flattenedResult += parseStatementChain(this, bodyBlock);
  }
  return flattenedResult;
};

// 3) math_number block so we can read numeric values
JSONGenerator["math_number"] = function (block) {
  const numVal = block.getFieldValue("NUM") || "0";
  return numVal + ","; // return as a string
};

// 4) Example “acquire_frame_block”
JSONGenerator["acquire_frame_block"] = function (block) {
  const channel = block.getFieldValue("CHANNEL");
  const step = {
    id: block.id,
    stepName: "Acquire Frame",
    mainFuncName: "acquire_frame",
    mainParams: { channel },
    preFuncs: [],
    preParams: {},
    postFuncs: [],
    postParams: {},
  };
  return JSON.stringify(step) + ",";
};

/**
 * Finally, the top-level workspaceToCode for your generator:
 * - It collects top blocks, traverses them, and produces one big JSON array: { steps: [...] }
 */
JSONGenerator.workspaceToCode = function (workspace) {
  const topBlocks = workspace.getTopBlocks(true);

  let bigJsonString = "";
  for (const block of topBlocks) {
    bigJsonString += this.blockToCode(block);
  }

  // We have comma-separated JSON objects. Let's split by commas, parse them carefully.
  // An easier approach: accumulate them in an array manually. But let's do a quick parse here:
  let steps = [];
  // Quick split on commas
  let tokens = bigJsonString.split(/,(?![^[]*\]|[^"]*")/).map((t) => t.trim());
  // Filter out empty lines
  tokens = tokens.filter((x) => x.length > 0);

  tokens.forEach((token) => {
    try {
      const obj = JSON.parse(token);
      steps.push(obj);
    } catch (err) {
      // might fail if token is incomplete
    }
  });

  // we have to soround the steps with the steps key: {"steps": [ ... ]}
  steps = {"steps": [steps]};
  return JSON.stringify({ steps }, null, 2);
};

/**
 * Now we override workspaceToCode (or a similar function) to do a top-level
 * traversal that concatenates these JSON strings, parses them, and
 * wraps them in {"steps": [ ... ]}.
 */
JSONGenerator.workspaceToCode = function (workspace) {
  // Get top blocks
  const topBlocks = workspace.getTopBlocks(true);

  // We'll accumulate the final steps array
  const steps = [];

  const traverseBlock = (block) => {
    if (!block) return;

    // For each block, call its generator
    let code = this.blockToCode(block);
    code = code.trim().replace(/,$/, ""); // remove trailing comma

    if (code) {
      try {
        // parse the returned string into an object but only after sorounding it with the steps 
        code = `{"steps": [${code}]}`;
        const stepObj = JSON.parse(code);
        steps.push(stepObj);
      } catch (err) {
        console.warn("Error parsing step JSON", err, code);
      }
    }

    // If there's a connected next block, traverse it
    const nextBlock = block.getNextBlock();
    if (nextBlock) {
      traverseBlock(nextBlock);
    }
  };

  // walk each top block
  for (const block of topBlocks) {
    traverseBlock(block);
  }

  // Return the final JSON
  return JSON.stringify({ steps }, null, 2);
};

export default JSONGenerator;
