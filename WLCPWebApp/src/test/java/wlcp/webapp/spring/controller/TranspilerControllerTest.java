package wlcp.webapp.spring.controller;

import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Paths;

import javax.inject.Inject;
import javax.persistence.EntityManager;
import javax.sql.DataSource;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.fasterxml.jackson.databind.ObjectMapper;

import wlcp.model.master.Game;
import wlcp.model.master.Username;
import wlcp.model.master.connection.Connection;
import wlcp.model.master.state.OutputState;
import wlcp.model.master.state.StartState;
import wlcp.model.master.transition.Transition;
import wlcp.webapp.spring.config.TestMVCConfig;
import wlcp.webapp.spring.config.TestPersistenceJPAConfig;

@RunWith(SpringRunner.class)
@WebAppConfiguration
@ContextConfiguration(classes = {TestPersistenceJPAConfig.class, TestMVCConfig.class})
public class TranspilerControllerTest {
	
	@Inject
	EntityManager entityManager;
	
	@Inject
    private WebApplicationContext wac;

    private MockMvc mockMvc;
	
    @Inject
    private DataSource dataSource;
    
    private static boolean setup = false;
    
    @Before
    public void setup() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(this.wac).build();
		if (!setup) {
			//Load test data
			setup = true;
		}
    }
    
    @Test
    @Transactional
    public void testTranspiler() throws Exception {
    	createGame();
    	MvcResult result = mockMvc.perform(get("/Controllers/transpileGame?gameId=test&write=false")).andExpect(status().isOk()).andReturn();
    	System.out.println(result.getResponse().getContentAsString());
    }
    
    private void createGame() {
    	Game game = new Game("test", 3, 3, new Username("Test", "", "", "", ""), true, false);
    	StartState startState = new StartState();
    	startState.setStateId("start_state");
    	startState.setGame(game);
    	game.getStates().add(startState);
    	entityManager.persist(startState);
    	entityManager.persist(game);
    	entityManager.flush();
    }

}
