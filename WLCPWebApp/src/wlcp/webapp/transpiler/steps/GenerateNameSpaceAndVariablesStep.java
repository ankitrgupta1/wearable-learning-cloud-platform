package wlcp.webapp.transpiler.steps;

import wlcp.model.master.state.StartState;

public class GenerateNameSpaceAndVariablesStep implements ITranspilerStep {

	private StartState startState;
	
	public GenerateNameSpaceAndVariablesStep(StartState startState) {
		this.startState = startState;
	}
	
	@Override
	public String PerformStep() {
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.append("var FSMGame = {\n\n");
		stringBuilder.append("   " + "gameInstanceId : 0,\n");
		stringBuilder.append("   " + "team : 0,\n");
		stringBuilder.append("   " + "player : 0,\n\n");
		stringBuilder.append("   " + "state : states." + startState.getStateId() + ",\n");
		stringBuilder.append("   " + "oldState : null,\n\n");
		return stringBuilder.toString();
	}

}