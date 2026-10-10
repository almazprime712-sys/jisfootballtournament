(() => {
  const copy = {
    ru: { addPlayer:'Добавить', empty:'Пока пусто', editorAdd:'Добавить игрока', editorEdit:'Изменить игрока', saved:'Изменения сохранены на этом устройстве.', duplicate:'Такой номер в этой команде уже есть.', deleteConfirm:'Удалить игрока из состава?', countOne:'игрок', countFew:'игрока', countMany:'игроков', gk:'Вратарь', cb:'Центральный защитник', cm:'Центральный полузащитник', st:'Нападающий', localNote:'Изменения сохраняются только в этом браузере.' },
    uz: { addPlayer:'Qo‘shish', empty:'Hozircha bo‘sh', editorAdd:'Futbolchi qo‘shish', editorEdit:'Futbolchini tahrirlash', saved:'O‘zgarishlar shu qurilmada saqlandi.', duplicate:'Bu raqam jamoada band.', deleteConfirm:'Futbolchini tarkibdan o‘chirasizmi?', countOne:'futbolchi', countFew:'futbolchi', countMany:'futbolchi', gk:'Darvozabon', cb:'Markaziy himoyachi', cm:'Markaziy yarim himoyachi', st:'Hujumchi', localNote:'O‘zgarishlar faqat shu brauzerda saqlanadi.' },
    en: { addPlayer:'Add player', empty:'Empty slot', editorAdd:'Add player', editorEdit:'Edit player', saved:'Changes saved on this device.', duplicate:'That number is already used by this team.', deleteConfirm:'Remove this player from the line-up?', countOne:'player', countFew:'players', countMany:'players', gk:'Goalkeeper', cb:'Centre-back', cm:'Central midfielder', st:'Striker', localNote:'Changes are saved only in this browser.' }
  };
  const teams = [
    { id:'apex-eleven', name:'Apex Eleven', sort_order:1 },
    { id:'dream-team', name:'Dream Team', sort_order:2 },
    { id:'legends', name:'Legends', sort_order:3 },
    { id:'fc-invictus', name:'FC Invictus', sort_order:4 },
    { id:'royal-force', name:'Royal Force', sort_order:5 }
  ];
  const defaults = [
    { id:'ibrohim', team_id:'apex-eleven', name:'Ibrohim', shirt_number:1, position:'GK', is_captain:false, sort_order:1 },
    { id:'aziz', team_id:'apex-eleven', name:'Aziz', shirt_number:4, position:'CB', is_captain:true, sort_order:2 },
    { id:'xurshid', team_id:'apex-eleven', name:'Xurshid', shirt_number:5, position:'CB', is_captain:false, sort_order:3 },
    { id:'alisher', team_id:'apex-eleven', name:'Alisher', shirt_number:8, position:'ST', is_captain:false, sort_order:4 },
    { id:'olmos', team_id:'apex-eleven', name:'Olmos', shirt_number:10, position:'ST', is_captain:false, sort_order:5 }
  ];
  const storageKey = 'team-lineups-v1';
  const teamPicker = document.getElementById('teamPicker');
  const positionCells = document.getElementById('positionCells');
  const fieldCount = document.getElementById('fieldCount');
  const activeTeamName = document.getElementById('activeTeamName');
  const rosterStatus = document.getElementById('rosterStatus');
  const editor = document.getElementById('rosterEditor');
  const playerForm = document.getElementById('rosterPlayerForm');
  const editorTitle = document.getElementById('editorTitle');
  const saveMessage = document.getElementById('editorSaveMessage');
  const deleteButton = document.getElementById('editorDeletePlayer');
  let language = document.documentElement.lang || 'ru';
  let activeTeamId = 'apex-eleven';
  let editId = null;
  let players = defaults.map((player) => ({ ...player }));

  const words = () => copy[language] || copy.ru;
  const positionWords = (position) => ({ GK:words().gk, CB:words().cb, CM:words().cm, ST:words().st }[position] || position);

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('apex-team-rosters-v1') || 'null');
    if (Array.isArray(saved)) players = saved.map((player) => ({ ...player, position:player.position === 'MF' ? 'CM' : player.position }));
  } catch { /* Keep the built-in line-up when browser storage is unavailable. */ }

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(players)); return true; }
    catch { return false; }
  }

  function renderTeams() {
    teamPicker.replaceChildren();
    teams.forEach((team) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'team-option';
      button.textContent = team.name;
      button.setAttribute('aria-pressed', String(team.id === activeTeamId));
      button.addEventListener('click', () => {
        activeTeamId = team.id;
        closeEditor();
        render();
      });
      teamPicker.append(button);
    });
  }

  function renderPlayers() {
    const list = players.filter((player) => player.team_id === activeTeamId)
      .sort((a,b) => (a.sort_order ?? 1000) - (b.sort_order ?? 1000) || Number(a.shirt_number) - Number(b.shirt_number));
    positionCells.replaceChildren();
    activeTeamName.textContent = teams.find((team) => team.id === activeTeamId)?.name || '';
    const n = list.length;
    if (language === 'ru') {
      const d10 = n % 10, d100 = n % 100;
      const form = d10 === 1 && d100 !== 11 ? words().countOne : d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14) ? words().countFew : words().countMany;
      fieldCount.textContent = `${n} ${form}`;
    } else fieldCount.textContent = `${n} ${n === 1 ? words().countOne : words().countMany}`;

    const lineY = { ST:22, CM:43, CB:63, GK:85 };
    const getXs = (code,count) => {
      if (code === 'GK') return count === 1 ? [50] : count === 2 ? [42,60] : count === 3 ? [31,50,69] : Array.from({length:count},(_,i)=>22 + i * (56 / Math.max(1,count-1)));
      if (count === 1) return [50];
      if (count === 2) return [35,65];
      if (count === 3) return [25,50,75];
      if (count === 4) return [22,40.7,59.3,78];
      return Array.from({length:count},(_,i)=>20 + i * (60 / Math.max(1,count-1)));
    };

    ['ST','CM','CB','GK'].forEach((code) => {
      const positionPlayers = list.filter((player) => player.position === code);
      const xs = getXs(code,positionPlayers.length);
      positionPlayers.forEach((player,index) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'position-player';
        if (positionPlayers.length > 2) card.classList.add(positionPlayers.length > 4 ? 'compact-player-small' : 'compact-player');
        card.dataset.position = code;
        card.dataset.editPlayer = player.id;
        card.style.left = `${xs[index]}%`;
        card.style.top = `${lineY[code]}%`;
        card.setAttribute('aria-label', `${words().editorEdit}: ${player.name}, ${code}, ${player.shirt_number}`);
        const top = document.createElement('span');
        top.className = 'card-top';
        const badge = document.createElement('span');
        badge.className = 'card-position';
        badge.textContent = code;
        const captain = document.createElement('span');
        captain.className = 'card-captain';
        captain.textContent = player.is_captain ? '★' : '';
        top.append(badge,captain);
        const number = document.createElement('strong');
        number.className = 'card-number';
        number.textContent = String(player.shirt_number).padStart(2,'0');
        const name = document.createElement('span');
        name.className = 'card-name';
        name.textContent = player.name;
        const role = document.createElement('span');
        role.className = 'card-role';
        role.textContent = positionWords(code);
        card.append(top,number,name,role);
        positionCells.append(card);
      });

      const addCard = document.createElement('button');
      addCard.type = 'button';
      addCard.dataset.position = code;
      addCard.dataset.addPosition = code;
      addCard.setAttribute('aria-label', `${words().addPlayer}: ${positionWords(code)}`);
      if (positionPlayers.length === 0) {
        addCard.className = 'position-player add-card';
        addCard.style.left = code === 'GK' ? '50%' : '50%';
        addCard.style.top = `${lineY[code]}%`;
        const plus = document.createElement('span');
        plus.className = 'add-symbol';
        plus.setAttribute('aria-hidden','true');
        plus.textContent = '+';
        const addLabel = document.createElement('span');
        addLabel.className = 'add-label';
        addLabel.textContent = words().addPlayer;
        const role = document.createElement('span');
        role.className = 'card-role';
        role.textContent = code;
        addCard.append(plus,addLabel,role);
      } else {
        addCard.className = 'position-add';
        const addX = positionPlayers.length <= 2 ? 90 : 8;
        addCard.style.left = `${addX}%`;
        addCard.style.top = `${lineY[code]}%`;
        addCard.textContent = '+';
        addCard.title = `${words().addPlayer}: ${positionWords(code)}`;
      }
      positionCells.append(addCard);
    });
  }

  function render() { renderTeams(); renderPlayers(); }

  function openEditor(position = 'GK', player = null) {
    editId = player?.id || null;
    playerForm.reset();
    playerForm.elements.position.value = player?.position || position;
    if (player) {
      playerForm.elements.name.value = player.name;
      playerForm.elements.shirt_number.value = player.shirt_number;
      playerForm.elements.captain.checked = Boolean(player.is_captain);
    }
    editorTitle.textContent = player ? words().editorEdit : words().editorAdd;
    deleteButton.hidden = !player;
    saveMessage.textContent = '';
    editor.hidden = false;
    playerForm.hidden = false;
    editor.scrollIntoView({ behavior:'smooth', block:'center' });
    playerForm.elements.name.focus({ preventScroll:true });
  }

  function closeEditor() {
    editor.hidden = true;
    playerForm.hidden = true;
    editId = null;
  }

  window.addEventListener('apex-language-change', (event) => {
    language = copy[event.detail] ? event.detail : 'ru';
    rosterStatus.textContent = words().localNote;
    render();
    if (!editor.hidden) editorTitle.textContent = editId ? words().editorEdit : words().editorAdd;
  });
  window.addEventListener('apex-add-position', (event) => openEditor(event.detail));
  window.addEventListener('apex-edit-player', (event) => {
    const player = players.find((item) => item.id === event.detail && item.team_id === activeTeamId);
    if (player) openEditor(player.position,player);
  });
  document.getElementById('editorClose').addEventListener('click', closeEditor);

  playerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = playerForm.elements;
    const payload = {
      team_id:activeTeamId,
      name:form.name.value.trim(),
      shirt_number:Number(form.shirt_number.value),
      position:form.position.value,
      is_captain:form.captain.checked,
      sort_order:editId ? (players.find((player) => player.id === editId)?.sort_order ?? 1000) : players.filter((player) => player.team_id === activeTeamId).length + 1
    };
    if (players.some((player) => player.team_id === activeTeamId && Number(player.shirt_number) === payload.shirt_number && player.id !== editId)) {
      saveMessage.textContent = words().duplicate;
      return;
    }
    if (editId) players = players.map((player) => player.id === editId ? { ...player,...payload } : player);
    else players.push({ id:globalThis.crypto?.randomUUID?.() || `player-${Date.now()}-${Math.random().toString(36).slice(2)}`,...payload });
    const persisted = save();
    renderPlayers();
    editId = null;
    playerForm.reset();
    editor.hidden = true;
    playerForm.hidden = true;
    rosterStatus.textContent = persisted ? words().saved : words().localNote;
  });

  deleteButton.addEventListener('click', () => {
    if (!editId || !window.confirm(words().deleteConfirm)) return;
    players = players.filter((player) => player.id !== editId);
    const persisted = save();
    closeEditor();
    renderPlayers();
    rosterStatus.textContent = persisted ? words().saved : words().localNote;
  });

  rosterStatus.textContent = words().localNote;
  render();
})();

