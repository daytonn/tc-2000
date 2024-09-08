(() => {
  window.addEventListener("load", () => {
    const $arcadeButtons = Array.from(
      document.querySelectorAll(".arcade-button"),
    );
    const $interactiveButton = document.querySelector("#interactive-button");
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

    function handleQuitInteractiveClick() {
      console.log("handleQuitInteractiveClick");
      $quitInteractiveButton.classList.remove("visible");
      setState(undoState);
      sendUpdatesOverWebSockets();
      renderState();
    }

    function handleInteractiveToggleClick() {
      undoState = buildPayload();
      setState({
        status: STATES.INTERACTIVE,
        players: [],
        currentPlayer: 0,
        currentPlayerIndex: 0,
        playerCount: 0,
      });
      sendUpdatesOverWebSockets();
      renderState();
      closeMenu();
    }

    function handleConfigureClick() {
      undoState = buildPayload();
      setState({ status: STATES.CONFIGURING });
      sendUpdatesOverWebSockets();
      renderState();
      closeMenu();
    }

    function handleCancelConfigClick() {
      setState(undoState);
      sendUpdatesOverWebSockets();
      renderState();
    }

    function handleRandomizeClick() {
      setState({ status: STATES.RANDOMIZING });
      clearArcadeButtons(false);
      renderState();
      closeMenu();
      sendUpdatesOverWebSockets();
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
      sendUpdatesOverWebSockets();
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
      sendUpdatesOverWebSockets();
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
      sendUpdatesOverWebSockets();
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
          sendUpdatesOverWebSockets();
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
          sendUpdatesOverWebSockets();
        }
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
      const newState = {
        ...buildPayload(),
        ...state,
      };

      configured = newState.configured;
      currentPlayer = newState.currentPlayer;
      currentPlayerIndex = newState.currentPlayerIndex;
      playerCount = newState.playerCount;
      players = newState.players;
      status = newState.status;

      return newState;
    }

    function sendUpdatesOverWebSockets() {
      Socket.send(JSON.stringify(buildPayload()));
    }

    function buildPayload() {
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
      switch (status) {
        case STATES.CONFIGURING:
          disableAllMenuOptions({ except: [$resetButton, $colorButton] });
          break;
        case STATES.INTERACTIVE:
          disableAllMenuOptions({ except: [$resetButton, $colorButton] });
          break;
        case STATES.RANDOMIZING:
          disableAllMenuOptions();
          break;
        default:
          enableAllMenuOptions();
          break;
      }
    }

    function disableAllMenuOptions({ except, only } = {}) {
      const onlyFilter = Array.isArray(only)
        ? only.map((x) => x.getAttribute("id"))
        : only
          ? [only.getAttribute("id")]
          : [];
      const exceptFilter = Array.isArray(except)
        ? except.map((x) => x.getAttribute("id"))
        : except
          ? [except.getAttribute("id")]
          : [];

      $menuButtons.forEach((button) => {
        const id = button.getAttribute("id");
        if (exceptFilter.includes(id)) return;
        if (onlyFilter.length === 0) {
          button.setAttribute("disabled", "");
        }
        if (onlyFilter.length && onyFilter.includes(id)) {
          button.setAttribute("disabled", "");
        }
      });
    }

    function enableAllMenuOptions({ except, only } = {}) {
      const onlyFilter = Array.isArray(only)
        ? only.map((x) => x.getAttribute("id"))
        : only
          ? [only.getAttribute("id")]
          : [];
      const exceptFilter = Array.isArray(except)
        ? except.map((x) => x.getAttribute("id"))
        : except
          ? [except.getAttribute("id")]
          : [];

      $menuButtons.forEach((button) => {
        const id = button.getAttribute("id");
        if (exceptFilter.includes(id)) return;
        if (onlyFilter.length && onyFilter.includes(id)) {
          button.removeAttribute("disabled");
        }
        if (onlyFilter.length === 0) {
          button.removeAttribute("disabled");
        }
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
    }

    function showConfigButtons() {
      $clearButton.classList.add("visible");
      $saveButton.classList.add("visible");
      $cancelButton.classList.add("visible");
    }

    function renderButtons() {
      hideConfigButtons();
      clearArcadeButtons();

      if (status === STATES.RANDOMIZING) {
        togglePlayerButton(currentPlayer);
      }

      if (status === STATES.CONFIGURING) {
        showConfigButtons();
        players.forEach((player, i) => {
          renderPlayerNumber(player, i);
          switchPlayerButtonOn(player);
        });
      }

      if (status === STATES.INTERACTIVE) {
        $quitInteractiveButton.classList.add("visible");

        players.forEach((player, i) => {
          switchPlayerButtonOn(player);
        });
      }

      if (status === STATES.CONNECTED || status === STATES.RUNNING) {
        switchPlayerButtonOn(currentPlayer);
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
