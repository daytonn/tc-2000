(() => {
  window.addEventListener("load", () => {
    const DEBUG_STATE = true;
    const $arcadeButtons = Array.from(
      document.querySelectorAll(".arcade-button"),
    );
    const $interactiveButton = document.querySelector("#interactive-button");
    const $controlModeButton = document.querySelector("#control-button");
    const $quitControlModeButton = document.querySelector(
      ".action-button.quit-control",
    );
    const $nextButton = document.querySelector(".action-button.control-next");
    const $clearButton = document.querySelector(".action-button.clear-all");
    const $colorButton = document.querySelector("#color-config-button");
    const $menu = document.querySelector(".menu");
    const $menuToggle = document.querySelector(".menu-toggle");
    const $playerCount = document.querySelector("#player-count");
    const $pokerTable = document.querySelector(".poker-table");
    const $resetButton = document.querySelector("#reset-button");
    const $quitInteractiveButton = document.querySelector(
      ".action-button.quit-interactive",
    );
    const $saveButton = document.querySelector(".action-button.save");
    const $cancelButton = document.querySelector(".action-button.cancel");
    const $statusIndicator = document.querySelector(".status-indicator");
    const $configureButton = document.querySelector("#configure-button");
    const $randomPlayerButton = document.querySelector(
      "#randomize-player-button",
    );
    const $menuButtons = [
      $configureButton,
      $controlModeButton,
      $interactiveButton,
      $resetButton,
      $randomPlayerButton,
      $colorButton,
    ];

    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const STATES = {
      OFFLINE: 0,
      CONNECTED: 1,
      CONFIGURING: 2,
      RUNNING: 3,
      RANDOMIZING: 4,
      ERROR: 5,
      INTERACTIVE: 6,
      CONTROL: 7,
    };

    const STATUS = [
      "offline",
      "connected",
      "configuring",
      "running",
      "randomizing",
      "error",
      "interactive",
      "control",
    ];

    function isOffline() {
      return status === STATES.OFFLINE;
    }

    function isConnected() {
      return status === STATES.CONNECTED;
    }

    function isConfiguring() {
      return status === STATES.CONFIGURING;
    }

    function isRunning() {
      return status === STATES.RUNNING;
    }

    function isRandomizing() {
      return status === STATES.RANDOMIZING;
    }

    function isError() {
      return status === STATES.ERROR;
    }

    function isInteracting() {
      return status === STATES.INTERACTIVE;
    }

    function isControlling() {
      return status === STATES.CONTROL;
    }

    let currentPlayer = 0;
    let currentPlayerIndex = 0;
    let playerCount = 0;
    let players = [];
    let status = STATES.OFFLINE;
    let configured = false;
    let undoState = {
      currentPlayer,
      currentPlayerIndex,
      playerCount,
      players: [],
      status: STATES.OFFLINE,
      configured: false,
    };

    let Socket = new WebSocket("ws://tc2000:81");

    Socket.onmessage = function (event) {
      handleSocketMessage(event);
    };

    Socket.onclose = function () {
      console.log("lost connection, reconnecting in 5 seconds");
      Socket = null;
      setTimeout(() => (Socket = new WebSocket("ws://tc2000:81")), 5000);
    };
    Socket.addEventListener("disconnected", () => {
      console.log("socket is closed");
    });
    Socket.addEventListener("error", (error) => {
      console.log("socket error");
      console.error(error);
    });

    $controlModeButton.addEventListener("click", handleControlModeClick);
    $quitControlModeButton.addEventListener(
      "click",
      handleQuitControlModeClick,
    );
    $nextButton.addEventListener("click", handleNextButtonClick);
    $colorButton.addEventListener("click", handleColorToggle);
    $menuToggle.addEventListener("click", handleMenuToggle);
    $interactiveButton.addEventListener("click", handleInteractiveToggleClick);
    $clearButton.addEventListener("click", handleClearConfig);
    $resetButton.addEventListener("click", handleResetConfig);
    $saveButton.addEventListener("click", handleSaveConfig);
    $arcadeButtons.forEach((button) => {
      button.addEventListener("click", handleArcadeButtonClick(button));
    });
    $randomPlayerButton.addEventListener("click", handleRandomizeClick);
    $cancelButton.addEventListener("click", handleCancelConfigClick);
    $configureButton.addEventListener("click", handleConfigureClick);
    $quitInteractiveButton.addEventListener(
      "click",
      handleQuitInteractiveClick,
    );

    function handleQuitControlModeClick() {
      setState({ status: STATES.RUNNING });
      sendUpdates();
    }

    function handleNextButtonClick() {
      const nextIndex = currentPlayerIndex + 1;
      const index = nextIndex >= playerCount ? 0 : currentPlayerIndex + 1;

      setState({ currentPlayer: players[index], currentPlayerIndex: index });
      renderState();
      sendUpdates();
    }

    function handleControlModeClick() {
      setState({ status: STATES.CONTROL });
      renderState();
      closeMenu();
      sendUpdates();
    }

    function handleQuitInteractiveClick() {
      console.log("handleQuitInteractiveClick");
      $quitInteractiveButton.classList.remove("visible");
      setState(undoState);
      sendUpdates();
      renderState();
    }

    function handleInteractiveToggleClick() {
      undoState = getState();
      setState({
        status: STATES.INTERACTIVE,
        players: [],
        currentPlayer: 0,
        currentPlayerIndex: 0,
        playerCount: 0,
      });
      sendUpdates();
      renderState();
      closeMenu();
    }

    function handleConfigureClick() {
      undoState = getState();
      setState({ status: STATES.CONFIGURING });
      sendUpdates();
      renderState();
      closeMenu();
    }

    function handleCancelConfigClick() {
      setState(undoState);
      sendUpdates();
      renderState();
    }

    function handleRandomizeClick() {
      setState({ status: STATES.RANDOMIZING });
      clearArcadeButtons(false);
      renderState();
      closeMenu();
      sendUpdates();
    }

    function handleSocketMessage({ data }) {
      const json = JSON.parse(data);
      setState(json);
      renderState();
    }

    function handleColorToggle() {
      const span = $colorButton.querySelector("span");
      const text = $pokerTable.classList.contains("colored-buttons")
        ? "Colored Buttons"
        : "Uncolored Buttons";
      span.innerText = text;
      $pokerTable.classList.toggle("colored-buttons");
      closeMenu();
    }

    function handleMenuToggle() {
      $menu.classList.toggle("open");
    }
    $quitInteractiveButton;

    function handleClearConfig() {
      setState({
        players: [],
        playerCount: 0,
        currentPlayerIndex: 0,
        currentPlayer: 0,
        status: STATES.CONFIGURING,
        configured: false,
      });
      renderState();
      sendUpdates();
    }

    function handleResetConfig() {
      setState({
        players: [],
        currentPlayerIndex: 0,
        currentPlayer: 0,
        status: STATES.CONNECTED,
        playerCount: 0,
        configured: false,
      });
      renderState();
      sendUpdates();
      closeMenu();
    }

    function handleSaveConfig() {
      setState({
        players,
        playerCount: players.length,
        currentPlayerIndex: 0,
        currentPlayer: 0,
        status: STATES.RUNNING,
        configured: true,
      });
      renderState();
      undoState = {};
      sendUpdates();
    }

    function handleArcadeButtonClick(button) {
      const player = parseInt(button.getAttribute("player"), 10);

      return () => {
        if (status === STATES.CONFIGURING) {
          togglePlayer(player);
          setState({
            players,
            playerCount: players.length,
            currentPlayerIndex: 0,
            currentPlayer: players[0],
            status,
            configured,
          });
          renderState();
          sendUpdates();
        }

        if (status === STATES.CONTROL) {
          if (player === currentPlayer) {
            handleNextButtonClick();
          }
        }

        if (status === STATES.INTERACTIVE) {
          if (players.includes(player)) {
            players = players.filter((p) => p !== player);
          } else {
            players.push(player);
          }
          setState({
            players,
            currentPlayer: player,
            currentPlayerIndex: 0,
            playerCount: players.length,
          });
          renderState();
          sendUpdates();
        }

        // TODO
      };
    }

    function switchPlayerButtonOn(player) {
      const ab = getButton(player);
      ab.classList.add("selected");
    }

    function togglePlayerButton(player) {
      const ab = getButton(player);
      ab.classList.toggle("selected");
    }

    function setState(state) {
      const currentState = getState();
      if (JSON.stringify(state) === JSON.stringify(currentState)) {
        return;
      }
      const newState = {
        ...currentState,
        ...state,
      };

      configured = newState.configured;
      currentPlayer = newState.currentPlayer;
      currentPlayerIndex = newState.currentPlayerIndex;
      playerCount = newState.playerCount;
      players = newState.players;
      status = newState.status;

      if (DEBUG_STATE) {
        const statusName = STATUS[status];
        console.table(
          [
            {
              ...currentState,
              0: "Current",
              statusName,
              players: currentState.players.join(", "),
            },
            {
              ...state,
              0: "New",
              statusName,
              players: newState.players.join(", "),
            },
          ],
          [
            "0",
            "statusName",
            "configured",
            "currentPlayer",
            "currentPlayerIndex",
            "playerCount",
            "players",
          ],
        );
      }

      return newState;
    }

    function sendUpdates() {
      Socket.send(JSON.stringify(getState()));
    }

    function getState() {
      return {
        configured,
        currentPlayer,
        currentPlayerIndex,
        playerCount,
        players,
        status,
      };
    }

    function renderState() {
      renderPlayerCount();
      renderButtons();
      renderStatus();
      renderMenuState();
    }

    function renderMenuState() {
      if (isOffline()) {
        menuOptions($resetButton);
      }

      if (isConnected()) {
        menuOptions(
          $resetButton,
          $configureButton,
          $colorButton,
          $interactiveButton,
        );
      }

      if (isConfiguring()) {
        menuOptions($resetButton, $colorButton);
      }

      if (isRunning()) {
        menuOptions(
          $configureButton,
          $controlModeButton,
          $interactiveButton,
          $resetButton,
          $randomPlayerButton,
          $colorButton,
        );
      }

      if (isInteracting()) {
        menuOptions($resetButton, $colorButton);
      }

      if (isRandomizing()) {
        menuOptions();
      }

      if (isControlling()) {
        menuOptions($resetButton);
      }

      if (!configured) {
        menuOptions(
          $configureButton,
          $interactiveButton,
          $resetButton,
          $colorButton,
        );
      }
    }

    function menuOptions(...buttons) {
      const buttonIds = buttons.map((x) => x.id);
      $menuButtons.forEach((btn) => {
        if (buttonIds.includes(btn.getAttribute("id"))) {
          enableMenuOptions(btn);
        } else {
          disableMenuOptions(btn);
        }
      });
    }

    function disableMenuOptions(...buttons) {
      buttons.forEach((btn) => {
        btn.setAttribute("disabled", "");
      });
    }

    function enableMenuOptions(...buttons) {
      buttons.forEach((btn) => {
        btn.removeAttribute("disabled");
      });
    }

    function renderPlayerCount() {
      if (players == undefined)
        console.log("renderPlayerCount players undefined");
      $playerCount.innerText = players?.length;
    }

    function renderStatus() {
      clearStatus();
      if (status === STATES.RANDOMIZING) {
        $statusIndicator.classList.add(`random${currentPlayer}`);
      } else {
        $statusIndicator.classList.add(STATUS[status]);
      }
    }

    function getButton(player) {
      const button = $arcadeButtons.find((ab) => {
        return ab.getAttribute("player") == `${player}`;
      });

      return button || $arcadeButtons[0];
    }

    function openMenu() {
      $menu.classList.add("open");
    }

    function closeMenu() {
      $menu.classList.remove("open");
    }

    function clearArcadeButtons(removeNum = true) {
      $arcadeButtons.forEach((ab) => {
        if (removeNum) ab.querySelector("span")?.remove();
        ab.classList.remove("selected");
      });
    }

    function hideConfigButtons() {
      $clearButton.classList.remove("visible");
      $saveButton.classList.remove("visible");
      $cancelButton.classList.remove("visible");
      $nextButton.classList.remove("visible");
      $quitControlModeButton.classList.remove("visible");
    }

    function showConfigButtons() {
      $clearButton.classList.add("visible");
      $saveButton.classList.add("visible");
      $cancelButton.classList.add("visible");
    }

    function renderButtons() {
      hideConfigButtons();
      clearArcadeButtons();

      if (isRandomizing()) {
        togglePlayerButton(currentPlayer);
      }

      if (isConfiguring()) {
        showConfigButtons();
        players.forEach((player, i) => {
          renderPlayerNumber(player, i);
          switchPlayerButtonOn(player);
        });
      }

      if (isInteracting()) {
        $quitInteractiveButton.classList.add("visible");

        players.forEach((player, i) => {
          switchPlayerButtonOn(player);
        });
      }

      if (isConnected() || isRunning() || isControlling()) {
        switchPlayerButtonOn(currentPlayer);
      }

      if (isControlling()) {
        $nextButton.classList.add("visible");
        $quitControlModeButton.classList.add("visible");
      }
    }

    function renderPlayerNumber(player, i) {
      const num = createElement("span", i + 1);
      const btn = document.querySelector(`.arcade-button[player="${player}"]`);
      btn.appendChild(num);
    }

    function togglePlayer(player) {
      if (players.includes(player)) {
        players = players.filter((p) => p !== player);
      } else {
        players.push(player);
      }
    }

    function createElement(tagName, content, attrs = {}) {
      const el = document.createElement(tagName);

      Object.keys(attrs).forEach((key) => {
        if (key === "className") {
          el.classList.add(attrs[key]);
        } else {
          el.setAttribute(key, attrs[key]);
        }
      });

      if (typeof content === "string" || typeof content === "number") {
        el.innerText = content;
      } else {
        el.appendChild(content);
      }

      return el;
    }

    function clearStatus() {
      STATUS.forEach((c) => {
        $statusIndicator.classList.remove(c);
      });
      for (let i = 0; i < 10; i++) {
        $statusIndicator.classList.remove(`random${i}`);
      }
    }
  });
})();
