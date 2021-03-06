import React, { createContext, useEffect, useReducer, useState } from 'react';
import ReactDOM from 'react-dom';
import Voice from './Voice';
import Menu from './Menu';
import { ipcRenderer, remote } from 'electron';
import { AmongUsState, GameState } from '../main/GameReader';
import Settings, { ISettings, settingsReducer } from './Settings';
import LobbySettings, { ILobbySettings } from './LobbySettings';

let appVersion = '';
if (typeof window !== 'undefined' && window.location) {
	let ver;
	if (process.env.NODE_ENV === 'development') {
		ver = process.env.npm_package_version;
	} else {
		let query = new URLSearchParams(window.location.search.substring(1));
		ver = query.get('version');
	}
	appVersion = ver || '';
}


enum AppState { MENU, VOICE };

export const GameStateContext = createContext<AmongUsState>({} as AmongUsState);
export const SettingsContext = createContext<[ISettings, React.Dispatch<{
	type: "set" | "setOne";
	action: ISettings | [string, any];
}>]>(null as any);
export const LobbySettingsContext = createContext<[ILobbySettings, React.Dispatch<ILobbySettings>]>([{}, () => {}] as any);

function App() {
	const [state, setState] = useState<AppState>(AppState.MENU);
	const [gameState, setGameState] = useState<AmongUsState>({} as AmongUsState);
	const [settingsOpen, setSettingsOpen] = useState(false);
	//const [lobbySettings] = useState<[ILobbySettings]>({} as [ILobbySettings]);
	//const lobbySettings = useReducer((state: ILobbySettings): ILobbySettings => state, {});
	const lobbySettings = useState<ILobbySettings>({
		version: 1, // Todo: make incompatible server and client versions reject (players on older clients with unimplemented settings may have a completely different experience than intended)
		impostorVentChat: true,
		commsSabotageVoice: true,
		voiceDistanceModel: 0,
		exponentialGain: 0.8,
		voiceRadius: 5.32,
		//voiceMaxDistance: 6,
		voiceMaxDistance: 3.75,
		windowObstructedVolume: 0.5,
		windowObstructedMuffle: true,
		wallObstructedVolume: 0.2,
		wallObstructedMuffle: true
	} as ILobbySettings);
	const [lobbySettingsOpen, setLobbySettingsOpen] = useState(false);
	const [errored, setErrored] = useState(false);
	const settings = useReducer(settingsReducer, {
		alwaysOnTop: false,
		microphone: 'Default',
		inputGain: 1,
		speaker: 'Default',
		outputGain: 1,
		pushToTalk: false,
		server: 'https://crewlink.paulf.me',
		pushToTalkShortcut: 'V',
		deafenShortcut: 'RControl',
		muteShortcut: 'RAlt',
		deafenDeadShortcut: 'F1',
		deafenLivingShortcut: 'F2',
		offsets: {
			version: '',
			data: ''
		},
		hideCode: false,
		stereo: true,
		overlayMode: false
	});

	useEffect(() => {
		const onOpen = (_: Electron.IpcRendererEvent, isOpen: boolean) => {
			setState(isOpen ? AppState.VOICE : AppState.MENU);
		};
		const onState = (_: Electron.IpcRendererEvent, newState: AmongUsState) => {
			setGameState(newState);
		};
		let shouldInit = true;
		const onError = (_: Electron.IpcRendererEvent, error: string) => {
			alert(error + '\n\nRestart the app after you fix this.');
			shouldInit = false;
			setErrored(true);
		};
		ipcRenderer.on('gameOpen', onOpen);
		ipcRenderer.on('error', onError);
		ipcRenderer.on('gameState', onState);
		ipcRenderer.once('started', () => {
			if (shouldInit)
				setGameState(ipcRenderer.sendSync('initState'));
		})
		return () => {
			ipcRenderer.off('gameOpen', onOpen);
			ipcRenderer.off('error', onError);
			ipcRenderer.off('gameState', onState);
		}
	}, []);

	let page;
	switch (state) {
		case AppState.MENU:
			page = <Menu errored={errored}/>;
			break;
		case AppState.VOICE:
			page = <Voice/>;
			break;
	}
	
	let overlayMode = settings[0].overlayMode && gameState?.gameState !== undefined && gameState?.gameState !== GameState.UNKNOWN && gameState?.gameState !== GameState.MENU && gameState?.lobbyCode !== 'MENU';
	ipcRenderer.send('toggleOverlay', overlayMode);

	/*console.log(`lobbySettings current: ${Object.keys(lobbySettings[0])}`);
	for (let s of Object.keys(lobbySettings[0])) {
		console.log(`lobbySetting current: ${s} - ${lobbySettings[0][s]}`);
	}*/

	//if (lobbySettingsOpen && (gameState?.gameState === undefined || gameState?.gameState === GameState.UNKNOWN || gameState?.gameState === GameState.MENU)) setLobbySettingsOpen(false);

	return (
		<GameStateContext.Provider value={gameState}>
			<SettingsContext.Provider value={settings}>
				<LobbySettingsContext.Provider value={lobbySettings}>
					<div className={overlayMode ? "background-transparent" : "background"}>
						<div className="titlebar">
							<span className="title">CrewLink+ {appVersion}</span>
							<svg className="titlebar-button settings" onClick={() => { setSettingsOpen(!settingsOpen); setLobbySettingsOpen(false); }} onContextMenu={() => { setLobbySettingsOpen(/*gameState?.gameState !== undefined && gameState?.gameState !== GameState.UNKNOWN && gameState?.gameState !== GameState.MENU && gameState?.lobbyCode !== 'MENU' &&*/ !lobbySettingsOpen); setSettingsOpen(false); }} enableBackground="new 0 0 24 24" viewBox="0 0 24 24" fill="#868686" width="20px" height="20px">
								<g>
									<path d="M0,0h24v24H0V0z" fill="none" />
									<path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
								</g>
							</svg>
							<svg className="titlebar-button close" viewBox="0 0 24 24" fill="#868686" width="20px" height="20px" onClick={() => {
								if (lobbySettingsOpen) { 
									setLobbySettingsOpen(false);

									return;
								}

								if (settingsOpen) { 
									setSettingsOpen(false);

									return;
								}

								remote.getCurrentWindow().close();
							}}>
								<path d="M0 0h24v24H0z" fill="none" />
								<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
							</svg>
						</div>
						<Settings open={settingsOpen} /*onClose={() => setSettingsOpen(false)}*//>
						<LobbySettings open={lobbySettingsOpen} /*onClose={() => setLobbySettingsOpen(false)}*/ readOnly={/*gameState?.gameState !== GameState.LOBBY ||*/ /*gameState?.players?.length > 1*/gameState?.players?.find(p => p.isLocal)?.id !== 0}/>
						{page}
					</div>
				</LobbySettingsContext.Provider>
			</SettingsContext.Provider>
		</GameStateContext.Provider>
	)
}

ReactDOM.render(<App />, document.getElementById('app'));