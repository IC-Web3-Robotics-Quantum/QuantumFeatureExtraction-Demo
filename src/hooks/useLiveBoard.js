import { useCallback, useEffect, useRef, useState } from 'react';
import { liveScore } from '../utils/liveScore.js';
import { matchStagedScenario } from '../data/stagedScenarios.js';
import { midpointReading } from '../data/calibration.js';
import { PHYSICAL_RANGES } from '../data/calibration.js';

/*
  WebSocket client for the physical ESP32 board (docs/demo-fisico-spec.md
  §4, §7.3). The board is a pure I/O peripheral: it sends raw knob/switch
  readings, and this hook is the only place that turns those into a verdict
  — by calling liveScore(), the exact same qFeatures()/predict() path the
  rest of the app uses. The board never runs its own copy of the model.

  Wire format (per spec):
    ESP32 -> browser: { hoistLoad, crowdVib, driveTemp, cableTension, mode }
    browser -> ESP32: { classicalAlert, quantumAlert }

  Also supports a "simulated board" mode: dragging the sliders in
  SimulatedBoardPanel calls updateSimulation() directly, going through the
  exact same applyReading() path a real WS message would.
*/

const RECONNECT_DELAY_MS = 3000;

export function useLiveBoard(onExternalReading) {
  const defaultReading = midpointReading();
  const [status, setStatus] = useState('disconnected'); // disconnected | connecting | connected | error
  const [url, setUrl] = useState('ws://192.168.4.1/ws');
  const [enabled, setEnabled] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [reading, setReading] = useState(defaultReading); // last { hoistLoad, crowdVib, driveTemp, cableTension, mode? }
  const [result, setResult] = useState(() => liveScore(defaultReading)); // last liveScore() output
  const [stagedMatch, setStagedMatch] = useState(() => matchStagedScenario(defaultReading)); // matched src/data/stagedScenarios.js entry, or null
  const [lastError, setLastError] = useState(null);
  const [manualMode, setManualMode] = useState('quantum'); // used until the board sends a real `mode`

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // Single place that turns a raw 4-value reading into a verdict — used by
  // both the WS message handler and the slider-driven simulation.
  const applyReading = useCallback(
    (nextReading, origin = 'sliders') => {
      setReading(nextReading);
      const score = liveScore(nextReading);
      setResult(score);
      setStagedMatch(matchStagedScenario(nextReading));
      if (typeof onExternalReading === 'function') {
        onExternalReading(nextReading, origin);
      }
      return score;
    },
    [onExternalReading]
  );

  const disconnect = useCallback(() => {
    setEnabled(false);
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  const connect = useCallback(
    (targetUrl) => {
      setIsSimulating(false);
      setUrl(targetUrl);
      setEnabled(true);
    },
    []
  );

  const startSimulation = useCallback(
    (initialReading, origin = 'sliders') => {
      disconnect();
      setIsSimulating(true);
      applyReading(initialReading || defaultReading, origin);
    },
    [disconnect, applyReading, defaultReading]
  );

  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
  }, []);

  const updateSimulation = useCallback(
    (nextReading) => {
      applyReading(nextReading, 'sliders');
    },
    [applyReading]
  );

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    const open = () => {
      if (cancelled) return;

      setStatus('connecting');
      setLastError(null);

      let socket;
      try {
        socket = new WebSocket(url);
      } catch (err) {
        setStatus('error');
        setLastError(err.message);
        return;
      }
      wsRef.current = socket;

      socket.onopen = () => {
        if (cancelled) return;
        setStatus('connected');
        setLastError(null);
      };

      socket.onmessage = (event) => {
        if (cancelled) return;
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          setLastError('ESP32 message is not valid JSON.');
          return;
        }

        const sensorKeys = ['hoistLoad', 'crowdVib', 'driveTemp', 'cableTension'];
        const invalidKey = sensorKeys.find((key) => {
          const value = Number(msg?.[key]);
          const range = PHYSICAL_RANGES[key];
          return !Number.isFinite(value) || value < range.min || value > range.max;
        });
        if (invalidKey) {
          setLastError(`ESP32 payload has an invalid ${invalidKey} reading.`);
          return;
        }

        const nextReading = sensorKeys.reduce((reading, key) => {
          reading[key] = Number(msg[key]);
          return reading;
        }, {});
        if (msg.mode === 'classical' || msg.mode === 'quantum') {
          nextReading.mode = msg.mode;
        }

        const score = applyReading(nextReading, 'esp32');

        if (socket.readyState === WebSocket.OPEN) {
          try {
            socket.send(
              JSON.stringify({
                classicalAlert: score.classicalAlert,
                quantumAlert: score.quantumAlert,
              })
            );
          } catch (error) {
            setLastError(`ESP32 response failed: ${error.message}`);
          }
        }
      };

      socket.onerror = () => {
        if (cancelled) return;
        setStatus('error');
      };

      socket.onclose = () => {
        if (cancelled) return;
        wsRef.current = null;
        if (enabledRef.current) {
          setStatus('connecting');
          reconnectTimerRef.current = setTimeout(open, RECONNECT_DELAY_MS);
        } else {
          setStatus('disconnected');
        }
      };
    };

    open();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, url, applyReading]);

  const activeMode = reading?.mode || manualMode;

  const setMode = useCallback((nextMode) => {
    setManualMode(nextMode);
  }, []);

  return {
    status,
    url,
    enabled,
    isSimulating,
    reading,
    result,
    stagedMatch,
    lastError,
    activeMode,
    connect,
    disconnect,
    startSimulation,
    stopSimulation,
    updateSimulation,
    setMode,
    setManualMode: setMode,
  };
}
