package wlcp.gameserver.tasks;

import java.nio.ByteBuffer;
import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;

import javax.persistence.Query;

import wlcp.gameserver.common.JPAEntityManager;
import wlcp.gameserver.module.ModuleManager;
import wlcp.gameserver.module.Modules;
import wlcp.gameserver.modules.LoggerModule;
import wlcp.gameserver.modules.TaskManagerModule;
import wlcp.gameserver.task.ITask;
import wlcp.gameserver.task.Task;
import wlcp.model.master.Game;
import wlcp.model.master.GameInstance;
import wlcp.model.master.GameLobby;
import wlcp.model.master.Username;
import wlcp.shared.packet.IPacket;
import wlcp.shared.packets.GameInstanceStartedPacket;
import wlcp.shared.packets.GameLobbiesPacket;
import wlcp.shared.packets.GameLobbyInfo;
import wlcp.shared.packets.StartGameInstancePacket;

public class ServerPacketHandlerTask extends Task implements ITask {
	
	private LinkedList<PacketClientData> recievedPackets;
	private JPAEntityManager entityManager;
	private PacketDistributorTask packetDistributor;
	private LoggerModule logger;

	public ServerPacketHandlerTask() {
		super("Server Packet Handler");
		recievedPackets = new LinkedList<PacketClientData>();
		entityManager = new JPAEntityManager();
		packetDistributor = (PacketDistributorTask) ((TaskManagerModule) ModuleManager.getInstance().getModule(Modules.TASK_MANAGER)).getTasksByType(PacketDistributorTask.class).get(0);
		logger = (LoggerModule) ModuleManager.getInstance().getModule(Modules.LOGGER);
	}
	
	public void DistributePacket(PacketClientData packetClientData) {
		try {
			accquire();
			recievedPackets.add(packetClientData);
			release();
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	@Override
	public void Update() {
		try {
			accquire();
			while(recievedPackets.size() > 0) {
				HandlePacket(recievedPackets.remove());
			}
			release();
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	@Override
	public void CleanUp() {
		entityManager.CleanUp();
	}
	
	private void HandlePacket(PacketClientData packetClientData) {
		switch(packetClientData.packet.getType()) {
		case START_GAME_INSTANCE:
			StartGameInstance(packetClientData);
			break;
		case GAME_LOBBIES:
			GetGameLobbies(packetClientData);
			break;
		default:
			break;
		}
	}
	
	private void StartGameInstance(PacketClientData packetClientData) {
		
		//Get the start game packet
		StartGameInstancePacket startGameInstancePacket = (StartGameInstancePacket) packetClientData.packet;
		
		//1. Make sure the game exists
		Game game = entityManager.getEntityManager().find(Game.class, startGameInstancePacket.getGameId());
		
		//2. Make sure the game lobby exists
		//3. Make sure a game instance of the lobby has not already been started
		for(Task task : ((TaskManagerModule) ModuleManager.getInstance().getModule(Modules.TASK_MANAGER)).getTasksByType(GameInstanceTask.class)) {
			if(((GameInstanceTask)task).getGameLobby().getGameLobbyId() == startGameInstancePacket.getGameLobbyId()) {
				logger.write("Game " + game.getGameId() + " has already been started with lobby " + ((GameInstanceTask)task).getGameLobby().getGameLobbyName());
				return;
			}
		}
		//4. Create the instance
		
		//Add it to the database
		entityManager.getEntityManager().getTransaction().begin();
		GameLobby gameLobby = entityManager.getEntityManager().find(GameLobby.class, startGameInstancePacket.getGameLobbyId());
		GameInstance gameInstance = new GameInstance(gameLobby, game);
		entityManager.getEntityManager().persist(gameInstance);
		entityManager.getEntityManager().getTransaction().commit();
		
		//Get the task manager
		TaskManagerModule taskManager = (TaskManagerModule) ModuleManager.getInstance().getModule(Modules.TASK_MANAGER);
		
		//Create the game instance
		GameInstanceTask newGameInstance = new GameInstanceTask(gameInstance, game, gameLobby);
		
		//Add the game instance
		taskManager.addTask(newGameInstance);
		
		//5. Send back success
		GameInstanceStartedPacket packet = new GameInstanceStartedPacket(newGameInstance.getGameInstanceId());
		
		//Send off the packet
		packetDistributor.AddPacketToSend(packet, packetClientData.clientData);
	}
	
	private void GetGameLobbies(PacketClientData packetClientData) {
		
		//Get the packet
		GameLobbiesPacket packet = (GameLobbiesPacket) packetClientData.packet;
		
		//Setup a query to join a game instance with a game lobby 
		//and then see if the username requested is a part of the
		//game lobby username list
		Query query = entityManager.getEntityManager().createQuery("SELECT gi FROM GameInstance gi JOIN GameLobby l WHERE l = gi.gameLobby AND :username MEMBER OF l.gameLobbyUsers", GameInstance.class);
		
		//Get the username and set it as a variable in the query
		query.setParameter("username", entityManager.getEntityManager().getReference(Username.class, packet.getUsername()));
		
		//Retrieve the results
		List<GameInstance> gameInstances = query.getResultList();
		
		for(GameInstance gi : gameInstances) {
			//packet.getGames().add(gi.getGameLobby().getGameLobbyName() + " (" + gi.getGame().getGameId() + ")");
			packet.getGameLobbyInfo().add(new GameLobbyInfo(gi.getGame().getGameId(), gi.getGameLobby().getGameLobbyName(), gi.getGameLobby().getGameLobbyId(), gi.getGameInstanceId()));
		}
		
		//Send off the packet
		packetDistributor.AddPacketToSend(packet, packetClientData.clientData);
	}
}
