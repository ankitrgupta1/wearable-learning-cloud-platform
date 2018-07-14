var StateScopeValidationRule = class StateScopeValidationRule extends ValidationRule {

	validate(state) {
		
		//Get the connections going to this state
		var connectionsToState = GameEditor.getJsPlumbInstance().getConnections({target : state.htmlId});
		
		//TODO: What if no connections?
		var newConnectionsToState = [];
		for(var i = 0; i < connectionsToState.length; i++) {
			for(var n = 0; n < GameEditor.getEditorController().connectionList.length; n++) {
				if(connectionsToState[i].id == GameEditor.getEditorController().connectionList[n].connectionId) {
					if(!GameEditor.getEditorController().connectionList[n].isLoopBack) {
						newConnectionsToState.push(connectionsToState[i]);
					}
				}
			}
		}
		connectionsToState = newConnectionsToState;
		
		if(connectionsToState.length == 0) { return; }
		
		//Get the connections stemming of the source of this states connection
		var neighborConnections = GameEditor.getJsPlumbInstance().getConnections({source : connectionsToState[0].sourceId});
		
		var neighborConnections2 = [];
		
		for(var i = 0; i < connectionsToState.length; i++) {
			var connections = GameEditor.getJsPlumbInstance().getConnections({source : connectionsToState[i].sourceId});
			for(var n = 0; n < connections.length; n++) {
				neighborConnections2.push(connections[n]);
			}
		}
		
		//Maintain a list of states the previous one is connected to
		var stateList = [];
		
		//Loop through all of these connections to get their active masks
		for(var i = 0; i < neighborConnections.length; i++) {
		
			//Find the state that the connection points to
			for(var n = 0; n < GameEditor.getEditorController().stateList.length; n++) {
				if(neighborConnections[i].targetId == GameEditor.getEditorController().stateList[n].htmlId) {
					stateList.push(GameEditor.getEditorController().stateList[n]);
				}
			}	
		}
		
		var orMaskAll = 0;
		
		//Loop through and or all active masks that have the same parent
		for(var i = 0; i < stateList.length; i++) {
			
			//Get the active scopes
			var activeScopes = this.getActiveScopes(stateList[i].modelJSON);
			
			//Get the active scope mask
			var activeScopeMask = this.getActiveScopeMask(GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam, activeScopes);
			
			orMaskAll = orMaskAll | activeScopeMask;
		}

		//Loop through all of the states and apply their scope
		for(var i = 0; i < stateList.length; i++) {
			
			var orMaskNeighbors = 0;
			
			//Get a list of connections whose target are the current state
			var targetConnections = GameEditor.getJsPlumbInstance().getConnections({target : stateList[i].htmlId});
			var neighborStateList = [];
			
			//Loop through those connections and get neighbors
			for(var n = 0; n < targetConnections.length; n++) {
				var connections = GameEditor.getJsPlumbInstance().getConnections({source : targetConnections[n].sourceId});
				for(var j = 0; j < connections.length; j++) {
					if(connections[j].targetId != stateList[i].htmlId) {
						for(var k = 0; k < GameEditor.getEditorController().stateList.length; k++) {
							if(GameEditor.getEditorController().stateList[k].htmlId == connections[j].targetId) {
								neighborStateList.push(GameEditor.getEditorController().stateList[k]);
							}
						}
					}
				}
			}
			
			for(var n = 0; n < neighborStateList.length; n++) {
				//Get the active scopes
				var activeScopes = this.getActiveScopes(neighborStateList[n].modelJSON);
				
				//Get the active scope mask
				var activeScopeMask = this.getActiveScopeMask(GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam, activeScopes);
				
				orMaskNeighbors = orMaskNeighbors | activeScopeMask;
			}
			
			if(this.getBit(orMaskNeighbors, 0) == 0 && orMaskNeighbors != 0) {
				orMaskNeighbors = this.setBit(orMaskNeighbors, 0);
			}
			
			var teamList2 = [];
			
			//Check for game wide to team (make sure it has team + players for that team)
			for(var team = 1; team < GameEditor.getEditorController().gameModel.TeamCount + 1; team++) {
				if(this.getBit(orMaskNeighbors, team) == 0x01) {
					teamList2.push("Team " + team);
			      }
			}
			
			if(teamList2.length > 0) {
				var l = [];
				for(var g = 0; g < teamList2.length; g++) {
					for(var c = 1; c < GameEditor.getEditorController().gameModel.PlayersPerTeam + 1; c++) {
						l.push(teamList2[g] + " Player " + c);
					}
				}
				orMaskNeighbors = orMaskNeighbors | this.getActiveScopeMask(GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam, l);
			}
		    
		    var playerReturn2 = true;
		    var playerReturns2 = [];
		    
		    var team = 1;
			var player = 1;
			var count = 1;
			for(var n = 0; n < (GameEditor.getEditorController().gameModel.TeamCount * GameEditor.getEditorController().gameModel.PlayersPerTeam); n++) {
				if(!this.getBit(orMaskNeighbors, n + GameEditor.getEditorController().gameModel.TeamCount + 1) == 0x01) {
	    			playerReturn2 = false;
//    	            break;
	    	    } else {
	    	    	count++;
	    	    }
				if(count == GameEditor.getEditorController().gameModel.PlayersPerTeam + 1) {
		    		playerReturns2.push("Team " + team);
		    		for(var player = 1; player < GameEditor.getEditorController().gameModel.PlayersPerTeam + 1; player++) {
		    			playerReturns2.push("Team " + team + " Player " + player);
		    		}
				}
//			    if(playerReturn2) {
//		    		playerReturns2.push("Team " + team);
//		    		for(var player = 1; player < GameEditor.getEditorController().gameModel.PlayersPerTeam + 1; player++) {
//		    			playerReturns2.push("Team " + team + " Player " + player);
//		    		}
//		    	} else {
//		    		playerReturn2 = true;
//		    	}
				if((n + 1) % GameEditor.getEditorController().gameModel.PlayersPerTeam == 0 && GameEditor.getEditorController().gameModel.TeamCount != 1 || GameEditor.getEditorController().gameModel.PlayersPerTeam == 1) { team ++; player = 1; count = 1; } else { player++; }
			}
		    
		    //Check for player wide to team wide
//		    for(var team = 1; team < GameEditor.getEditorController().gameModel.TeamCount + 1; team++) {
//		    	for(var player = 1; player < GameEditor.getEditorController().gameModel.PlayersPerTeam + 1; player++) {
//		    		if(!this.getBit(orMaskNeighbors, (GameEditor.getEditorController().gameModel.PlayersPerTeam * team) + player) == 0x01) {
//		    			playerReturn2 = false;
//	    	            break;
//		    	    }
//		    	}
//		    	if(playerReturn2) {
//		    		playerReturns2.push("Team " + team);
//		    		for(var player = 1; player < GameEditor.getEditorController().gameModel.PlayersPerTeam + 1; player++) {
//		    			playerReturns2.push("Team " + team + " Player " + player);
//		    		}
//		    	} else {
//		    		playerReturn2 = true;
//		    	}
//		    }
		    
		    if(playerReturns2.length > 0) {
		    	orMaskNeighbors = orMaskNeighbors | this.getActiveScopeMask(GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam, playerReturns2);
		    }
			
			var transList = [];
			
			//Loop through all of these connections to get their active masks
			for(var n = 0; n < neighborConnections.length; n++) {
			
				//Find the transition
				for(var j = 0; j < GameEditor.getEditorController().transitionList.length; j++) {
					if(neighborConnections[n].id == GameEditor.getEditorController().transitionList[j].connection.id) {
						if(neighborConnections[n].targetId != stateList[i].htmlId) {
							transList.push(GameEditor.getEditorController().transitionList[j]);
						}
					}
				}	
			}
			
			var transitionNeighborMask = 0;
			var someTransitionNeighborMask = 0;
			
			for(var n = 0; n < transList.length; n++) {
				//Get the active scopes
				var activeScopes = transList[n].validationRules[0].getActiveScopes(transList[n], transList);
				
				//Get the active scope mask
				var activeScopeMask = this.getActiveScopeMask(GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam, activeScopes);
				
				transitionNeighborMask = transitionNeighborMask | activeScopeMask;
				
				//Get the active scopes
				activeScopes = transList[n].validationRules[0].getActiveScopes3(transList[n], transList);
				
				//Get the active scope mask
				activeScopeMask = this.getActiveScopeMask(GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam, activeScopes);
				
				someTransitionNeighborMask = someTransitionNeighborMask | activeScopeMask;
				
				//var activeScopeMasks = this.getActiveScopeMasks(GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam, activeScopeMask);
				
				//someTransitionNeighborMask = someTransitionNeighborMask | this.andScopeMasks(activeScopeMasks);
				//someTransitionNeighborMask = someTransitionNeighborMask & (~activeScopeMask);
			}
			
			//Check if any of the team player bits are set
			//If so exclude the entire team + players from someTransitionNeighborMask
			if(someTransitionNeighborMask != 0) {
				if(this.getBit(someTransitionNeighborMask, 0) == 0x01) {
					someTransitionNeighborMask = 0xffffffff;
				} else {
					var playerSet = false;
					var playersSet = [];
					for(var team = 1; team < GameEditor.getEditorController().gameModel.TeamCount + 1; team++) {
				    	for(var player = 1; player < GameEditor.getEditorController().gameModel.PlayersPerTeam + 1; player++) {
				    		if(this.getBit(someTransitionNeighborMask, (GameEditor.getEditorController().gameModel.PlayersPerTeam * team) + player) == 0x01) {
				    			playerSet = true;
			    	            break;
				    		}
				    	}
				    	if(playerSet) {
				    		playersSet.push("Team " + team);
				    		for(var player = 1; player < GameEditor.getEditorController().gameModel.PlayersPerTeam + 1; player++) {
				    			playersSet.push("Team " + team + " Player " + player);
				    		}
				    		playerSet = false;
				    	} 
					}
					someTransitionNeighborMask = someTransitionNeighborMask | this.getActiveScopeMask(GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam, playersSet);
				}
			}
			
			var parentMask = 0;
			var nonTransitionMask = 0;
			var transitionMask = 0;
			
			//Get the connections going to our state and exclude loopbacks
			var connectionsToState2 = GameEditor.getJsPlumbInstance().getConnections({target : stateList[i].htmlId});
			var newConnectionsToState2 = [];
			var connectedToStart = false;
			for(var n = 0; n < connectionsToState2.length; n++) {
				for(var j = 0; j < GameEditor.getEditorController().connectionList.length; j++) {
					if(connectionsToState2[n].id == GameEditor.getEditorController().connectionList[j].connectionId) {
						if(!GameEditor.getEditorController().connectionList[j].isLoopBack) {
							newConnectionsToState2.push(connectionsToState2[n]);
						}
					}
				}
			}
			
			connectionsToState2 = newConnectionsToState2;
			
			//Get a list of connections without transitions
			var connectionsWithoutTransitions = [];
			
			//Get a list of connections with transitions
			var connectionsWithTransitions = [];
			
			for(var n = 0; n < connectionsToState2.length; n++) {
				var found = false;
				for(var j = 0; j < GameEditor.getEditorController().transitionList.length; j++) {
					if(connectionsToState2[n].id == GameEditor.getEditorController().transitionList[j].connection.id) {
						connectionsWithTransitions.push(connectionsToState2[n]);
						found = true;
					}
				}
				if(!found) {
					connectionsWithoutTransitions.push(connectionsToState2[n]);
				}
			}
			
			//If we have no transitions
			if(connectionsWithTransitions.length == 0) {
				//Loop through our parent states
				for(var n = 0; n < GameEditor.getEditorController().stateList.length; n++) {
					for(var j = 0; j < connectionsWithoutTransitions.length; j++) {
						if(connectionsWithoutTransitions[j].sourceId == GameEditor.getEditorController().stateList[n].htmlId && GameEditor.getEditorController().stateList[n].htmlId.includes("start")) {
							nonTransitionMask = 0xffffffff;
						} else if(connectionsWithoutTransitions[j].sourceId == GameEditor.getEditorController().stateList[n].htmlId && !GameEditor.getEditorController().stateList[n].htmlId.includes("start")) {
							//Get the active scopes
							var activeScopes = this.getActiveScopes(GameEditor.getEditorController().stateList[n].modelJSON);
							
							//Get the active scope mask
							var activeScopeMask = this.getActiveScopeMask(GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam, activeScopes);
							
							nonTransitionMask = nonTransitionMask | activeScopeMask;
						}
					}
				}
			}
			
			//If we have all transitions
			if(connectionsWithoutTransitions.length == 0) {
				//Loop through our parent states
				for(var n = 0; n < GameEditor.getEditorController().transitionList.length; n++) {
					for(var j = 0; j < connectionsWithTransitions.length; j++) {
						if(connectionsWithTransitions[j].id == GameEditor.getEditorController().transitionList[n].connection.id) {
							var activeScopes = GameEditor.getEditorController().transitionList[n].validationRules[0].getActiveScopes3(GameEditor.getEditorController().transitionList[n]);
							var activeScopeMask = this.getActiveScopeMask(GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam, activeScopes);
							transitionMask = transitionMask | activeScopeMask;
						} 
					}
				}
			}
			
			var transitionMask2 = 0;
			//If we have transitions and non transitions
			if(connectionsWithTransitions.length > 0 && connectionsWithoutTransitions.length > 0) {
				//Loop through our parent states
				for(var n = 0; n < GameEditor.getEditorController().transitionList.length; n++) {
					for(var j = 0; j < connectionsWithTransitions.length; j++) {
						if(connectionsWithTransitions[j].id == GameEditor.getEditorController().transitionList[n].connection.id) {
							var activeScopes = GameEditor.getEditorController().transitionList[n].validationRules[0].getActiveScopes3(GameEditor.getEditorController().transitionList[n]);
							var activeScopeMask = this.getActiveScopeMask(GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam, activeScopes);
							transitionMask2 = transitionMask2 | activeScopeMask;
						} 
					}
				}
				
				//Loop through our parent states
				for(var n = 0; n < GameEditor.getEditorController().stateList.length; n++) {
					for(var j = 0; j < connectionsWithoutTransitions.length; j++) {
						if(connectionsWithoutTransitions[j].sourceId == GameEditor.getEditorController().stateList[n].htmlId && !GameEditor.getEditorController().stateList[n].htmlId.includes("start")) {
							//Get the active scopes
							var activeScopes = this.getActiveScopes(GameEditor.getEditorController().stateList[n].modelJSON);
							
							//Get the active scope mask
							var activeScopeMask = this.getActiveScopeMask(GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam, activeScopes);
							
							nonTransitionMask = nonTransitionMask | activeScopeMask;
						}
					}
				}
			}

			
			var transitionAbove = false;
			var allTransitions = false; 
			var transitionCount = 0;
			//var connection = GameEditor.getJsPlumbInstance().getConnections({target : stateList[i].htmlId});
			var connection = newConnectionsToState2;
			for(var n = 0; n < connection.length; n++) {
				for(var j = 0; j < GameEditor.getEditorController().transitionList.length; j++) {
					if(connection[n].id == GameEditor.getEditorController().transitionList[j].connection.id) {
						transitionAbove = true;
						transitionCount++;
					}
				}
			}
			
			if(transitionCount == connection.length) {
				allTransitions = true;
			}
			
			if(!transitionAbove && !allTransitions && transList.length == 0) {
				parentMask = nonTransitionMask;
			} else if (!transitionAbove && transList.length > 0) {
				//parentMask = someTransitionNeighborMask;
				if(someTransitionNeighborMask != 0) {
					if(this.getBit(nonTransitionMask, 0) == 0x01) {
						var activeScopeMasks = this.getActiveScopeMasks(GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam, someTransitionNeighborMask);
						parentMask = this.andScopeMasks(activeScopeMasks);
						parentMask = parentMask & (~someTransitionNeighborMask);
					} else {
						parentMask = nonTransitionMask & (~someTransitionNeighborMask);
					}
				} else {
					parentMask = nonTransitionMask;
				}
			} else if(transitionAbove && !allTransitions) {
				parentMask = transitionMask2 | nonTransitionMask;
			} else if(allTransitions) {
				parentMask = transitionMask;
			}
				
			//Check for game wide to game wide
			if(this.getBit(parentMask, 0) == 0x01) {
				parentMask = 0xffffffff;
			}
			
			var teamList = [];
			
			//Check for game wide to team (make sure it has team + players for that team)
			for(var team = 1; team < GameEditor.getEditorController().gameModel.TeamCount + 1; team++) {
				if(this.getBit(parentMask, team) == 0x01) {
					teamList.push("Team " + team);
			      }
			}
			
			if(teamList.length > 0) {
				var l = [];
				for(var g = 0; g < teamList.length; g++) {
					for(var c = 1; c < GameEditor.getEditorController().gameModel.PlayersPerTeam + 1; c++) {
						l.push(teamList[g] + " Player " + c);
					}
				}
				parentMask = parentMask | this.getActiveScopeMask(GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam, l);
			}
		    
		    var playerReturn = true;
		    var playerReturns = [];
		    
		    team = 1;
			player = 1;
			count = 1;
			for(var n = 0; n < (GameEditor.getEditorController().gameModel.TeamCount * GameEditor.getEditorController().gameModel.PlayersPerTeam); n++) {
				if(!this.getBit(parentMask, n + GameEditor.getEditorController().gameModel.TeamCount + 1) == 0x01) {
	    			playerReturn2 = false;
//    	            break;
	    	    } else {
	    	    	count++;
	    	    }
				if(count == GameEditor.getEditorController().gameModel.PlayersPerTeam + 1) {
					playerReturns.push("Team " + team);
		    		for(var player = 1; player < GameEditor.getEditorController().gameModel.PlayersPerTeam + 1; player++) {
		    			playerReturns.push("Team " + team + " Player " + player);
		    		}
				}
//			    if(playerReturn2) {
//		    		playerReturns2.push("Team " + team);
//		    		for(var player = 1; player < GameEditor.getEditorController().gameModel.PlayersPerTeam + 1; player++) {
//		    			playerReturns2.push("Team " + team + " Player " + player);
//		    		}
//		    	} else {
//		    		playerReturn2 = true;
//		    	}
				if((n + 1) % GameEditor.getEditorController().gameModel.PlayersPerTeam == 0 && GameEditor.getEditorController().gameModel.TeamCount != 1 || GameEditor.getEditorController().gameModel.PlayersPerTeam == 1) { team ++; player = 1; count = 1; } else { player++; }
			}
		    
//		    //Check for player wide to team wide
//		    for(var team = 1; team < GameEditor.getEditorController().gameModel.TeamCount + 1; team++) {
//		    	for(var player = 1; player < GameEditor.getEditorController().gameModel.PlayersPerTeam + 1; player++) {
//		    		if(!this.getBit(parentMask, (GameEditor.getEditorController().gameModel.PlayersPerTeam * team) + player) == 0x01) {
//		    			playerReturn = false;
//	    	            break;
//		    	    }
//		    	}
//		    	if(playerReturn) {
//		    		playerReturns.push("Team " + team);
//		    		for(var player = 1; player < GameEditor.getEditorController().gameModel.PlayersPerTeam + 1; player++) {
//		    			playerReturns.push("Team " + team + " Player " + player);
//		    		}
//		    	} else {
//		    		playerReturn = true;
//		    	}
//		    }
		    
		    if(playerReturns.length > 0) {
				parentMask = parentMask | this.getActiveScopeMask(GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam, playerReturns);
		    }
		  
			//Get the active scope masks
			var activeScopeMasks = this.getActiveScopeMasks(GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam, orMaskAll);
			
			var toGameWideMask = 0;
			for(var n = 1; n < GameEditor.getEditorController().gameModel.TeamCount + (GameEditor.getEditorController().gameModel.TeamCount * GameEditor.getEditorController().gameModel.PlayersPerTeam) + 1; n++) {
				toGameWideMask = this.setBit(toGameWideMask, n);
			}
			
		    //Takes care of team to game wide
		    //Takes care of player to game wide
		    if((parentMask & toGameWideMask) == toGameWideMask) {
		    	parentMask = 0xffffffff;
		    }
//		    if((parentMask & 8190) == 8190) {
//		    	parentMask = 0xffffffff;
//		    }
		   
		    //if(!allTransitions) {
			    parentMask = parentMask & this.andScopeMasks(activeScopeMasks);
		    //}
		    
			if(!transitionAbove && !allTransitions && transList.length == 0)  {
				//Set the new scopes
				stateList[i].setScope(parentMask & (~orMaskNeighbors), GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam);	
			} else if (!transitionAbove && transList.length > 0) {
				stateList[i].setScope(parentMask & (~orMaskNeighbors), GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam);
			} else if(transitionAbove && !allTransitions) {
		    	stateList[i].setScope(parentMask & (~transitionNeighborMask), GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam);
			} else if(allTransitions) { 
		    	stateList[i].setScope(parentMask & (~transitionNeighborMask), GameEditor.getEditorController().gameModel.TeamCount, GameEditor.getEditorController().gameModel.PlayersPerTeam);
			}
		}	
	}
	
	static checkForLoopBacks(stateId, nextState, returnConnections) {
		var connections = GameEditor.getJsPlumbInstance().getConnections({source : nextState});
		for(var i = 0; i < connections.length; i++) {
			if(connections[i].targetId == stateId) {
				returnConnections.push(connections[i]);
			} else {
				this.checkForLoopBacks(stateId, connections[i].targetId, returnConnections, false);
			}
		}
	}
	
	static getConnectionsBelow(stateId, nextState, returnConnections) {
		var connections = GameEditor.getJsPlumbInstance().getConnections({source : nextState});
		for(var i = 0; i < connections.length; i++) {
			returnConnections.push(connections[i]);
			this.checkForLoopBacks(stateId, connections[i].targetId, returnConnections);
		}
	}
	
	getActiveScopes(model) {
		var activeScopes = [];
		for(var i = 0; i < model.iconTabs.length; i++) {
			if(model.iconTabs[i].displayText != "") {
				activeScopes.push(model.iconTabs[i].scope);
			}
		}
		return activeScopes;
	}
	
	getActiveScopeMask(teamCount, playersPerTeam, activeScopes) {
		var scopeMask = 0;
		var maskCount = 0;
		
		if(activeScopes.includes("Game Wide")) {
			scopeMask = this.setBit(scopeMask, maskCount);
		}
		maskCount++;
		
		for(var i = 0; i < teamCount; i++) {
			if(activeScopes.includes("Team " + (i + 1))) {
				scopeMask = this.setBit(scopeMask, maskCount);
			}
			maskCount++;
		}
		
		for(var i = 0; i < teamCount; i++) {
			for(var n = 0; n < playersPerTeam; n++) {
				if(activeScopes.includes("Team " + (i + 1) + " Player " + (n + 1))) {
					scopeMask = this.setBit(scopeMask, maskCount);
				}
				maskCount++;
			}
		}
		
		return scopeMask;
	}
	
	getActiveScopeMasks(teamCount, playersPerTeam, activeMask) {
		    
	    var scopeMasks = [];
	    
	    //Check for game wide
	    if(this.getBit(activeMask, 0)) {
	      scopeMasks.push(0x01);
	    }
	    
	    var teamReturn = true;
	    
	    //Check for team wide 
	    for(var i = 1; i < teamCount + 1; i++) {
	      if(this.getBit(activeMask, i) == 0x01) {
//	        var tempMask = 0;
//	        for(var n = 1; n < teamCount + (teamCount * playersPerTeam) + 1; n++) {
//	          if(!((n >= ((teamCount * i) + 1)) && (n < (teamCount * i) + 1 + playersPerTeam))) {
//	            tempMask = this.setBit(tempMask, n);
//	          }
//	        }
	       var tempMask = 0;
	       for(var n = 1; n < teamCount + 1; n++) {
	    	   tempMask = this.setBit(tempMask, n);
	       }
		   var team = 1;
		   var player = 1;
		   for(var n = 0; n < (teamCount * playersPerTeam); n++) {
			   if(i != team) {
				   tempMask = this.setBit(tempMask, n + teamCount + 1);
			   }
			   if((n + 1) % playersPerTeam == 0 && teamCount != 1 || playersPerTeam == 1) { team ++; player = 1; } else { player++; }
			}
	       scopeMasks.push(tempMask);
	      }
	    }
	    
	    //Check for player wide
		var team = 1;
		var player = 1;
		for(var i = 0; i < (teamCount * playersPerTeam); i++) {
			if(this.getBit(activeMask, i + teamCount + 1) == 0x01) {
				var tempMask = 0;
		        var found = false;
		        for(var j = 1; j < teamCount + (teamCount * playersPerTeam) + 1; j++) {
		          if(j != team) {
		            tempMask = this.setBit(tempMask, j);
		          } else {
		            found = true;
		          }
		        }
		        if(found) {
		          scopeMasks.push(tempMask);
		          //team++;
		          //break;
		        }
			}
			//if((i + 1) % teamCount == 0 && teamCount != 1 || playersPerTeam == 1) { team++; player = 1;} else { player++; }
			if((i + 1) % playersPerTeam == 0 && teamCount != 1 || playersPerTeam == 1) { team ++; player = 1; } else { player++; }
		}
//	    for(var i = 1; i < teamCount + 1; i++) {
//	      for(var n = 1; n < playersPerTeam + 1; n++) {
//	        if(this.getBit(activeMask, (teamCount * i) + n) == 0x01) {
//	          var tempMask = 0;
//	          var found = false;
//	          for(var j = 1; j < teamCount + (teamCount * playersPerTeam) + 1; j++) {
//	            if(j != i) {
//	              tempMask = this.setBit(tempMask, j);
//	            } else {
//	              found = true;
//	            }
//	          }
//	          if(found) {
//	            scopeMasks.push(tempMask);
//	            break;
//	          }
//	        }
//	      }
//	    }
	    
	    return scopeMasks;
	}
	  
    andScopeMasks(activeScopeMasks) {
	    var returnScope = 0xffffffff;
	    for(var i = 0; i < activeScopeMasks.length; i++) {
	      returnScope = returnScope & activeScopeMasks[i];
	    }
	    return returnScope;
	}
	
	setBit(number, bitNumber) {
	    var tempBit = 1;
	    tempBit = tempBit << bitNumber;
	    return number | tempBit;
	}
	
	getBit(number, bitNumber) {
	    return (number >> bitNumber) & 1;
	}

}