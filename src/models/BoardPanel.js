export default class BoardPanel {
  constructor(object, board) {
    this.object = object;
    this.board = board;
    this.steps = [];
  }

  loading() {
    return !this.object.data;
  }

  generateSteps() {
    if (!this.object.data || !this.object.data.boardRecipe) {
      return [];
    }
    const steps = [];
    const otherIds = this.otherObjectIds();
    const sharedIds = [];

    // let checkChain = false;

    let step = this.node(this.object.id);
    while (step) {
      steps.push(step);
      for (let id of this.stepObjectIds(step)) {
        if (otherIds.includes(id)) {
          sharedIds.push(id);
        }
      }
      step = this.nextStep(step, sharedIds);
      if (step) {
        if (!step.actorID && !step.targetID) {
          step = null;
        }
        // } else if (this.stepChainLength(step) === 0) {
        //   checkChain = true; // Check the chain length next time
        // } else if (checkChain && steps.length + this.stepChainLength(step) > 6) {
        //   step = null;
        // }
      }
    }
    this.steps = steps.reverse();
    this.broadcastSharedIds(sharedIds);
    return this.steps;
  }

  node(id) {
    if (!this.object.data || !this.object.data.boardRecipe) {
      return null;
    }
    return this.object.data.boardRecipe.nodes.find(n => n.id == id);
  }

  nextStep(node, sharedIds) {
    if (node.nextID && !sharedIds.includes(node.nextID)) {
      return this.node(node.nextID);
    }
    if (node.actorID && !sharedIds.includes(node.actorID)) {
      return this.node(node.actorID);
    }
    if (node.targetID && !sharedIds.includes(node.targetID)) {
      return this.node(node.targetID);
    }
  }

  // This returns how many steps only have one child in a chain
  // stepChainLength(step, length = 0) {
  //   // Find the step's children which are either relevant or not last
  //   let children = [step.actorID, step.targetID].filter(s => s && (s.relevant || !s.last));
  //   if (children.length === 1) {
  //     return this.stepChainLength(children[0], length + 1);
  //   }
  //   return length;
  // }

  ingredientIds() {
    const ingredientIds = [];
    const stepIds = this.steps.map(s => s.id);
    const otherIds = this.otherPanels().map(p => p.object.id);
    for (let step of this.steps) {
      if (step.actorID && !stepIds.includes(step.actorID) && !otherIds.includes(step.actorID)) {
        ingredientIds.push(step.actorID);
      }
      if (step.targetID && !stepIds.includes(step.targetID) && !otherIds.includes(step.targetID)) {
        ingredientIds.push(step.targetID);
      }
    }
    return ingredientIds;
  }

  otherPanels() {
    return this.board.panels.filter(p => p != this);
  }

  otherObjectIds() {
    return this.otherPanels().map(p => p.objectIds()).flat();
  }

  objectIds() {
    return this.steps.map(s => this.stepObjectIds(s)).flat();
  }

  stepObjectIds(step) {
    const ids = [];
    if (step.actorID) {
      ids.push(step.actorID);
    }
    if (step.targetID) {
      ids.push(step.targetID);
    }
    return ids;
  }

  broadcastSharedIds(sharedIds) {
    if (sharedIds.length === 0) {
      return;
    }
    for (let panel of this.otherPanels()) {
      panel.updateSharedIds(sharedIds);
    }
  }

  updateSharedIds(sharedIds) {
    const stepIds = this.steps.map(s => s.id);
    for (let sharedId of sharedIds) {
      if (stepIds.includes(sharedId)) {
        this.generateSteps();
        return;
      }
    }
  }
}
