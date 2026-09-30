import { useSyncExternalStore } from 'react'
import { asset } from './asset'

// A single soundtrack shared by the scene (light pulsing), the HUD (EQ bars)
// and the ending sequence. Web Audio is created lazily inside a user gesture,
// which is the only way browsers will let it start.

const VOLUME = 0.55
const listeners = new Set()
let el = null
let ctx = null
let gain = null
let analyser = null
let bins = null
let level = 0
let wanted = false

function emit() {
    listeners.forEach((l) => l())
}

function element() {
    if (!el) {
        el = new Audio(asset('audio.mp3'))
        el.loop = true
        el.preload = 'none'
        el.addEventListener('play', emit)
        el.addEventListener('pause', emit)
    }
    return el
}

function graph() {
    if (ctx) return
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    ctx = new AC()
    gain = ctx.createGain()
    gain.gain.value = 0
    analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8
    bins = new Uint8Array(analyser.frequencyBinCount)
    ctx.createMediaElementSource(element()).connect(analyser)
    analyser.connect(gain).connect(ctx.destination)
}

function ramp(to, seconds) {
    if (!gain) return
    const now = ctx.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(to, now + seconds)
}

export async function play() {
    wanted = true
    graph()
    const a = element()
    try {
        if (ctx?.state === 'suspended') await ctx.resume()
        await a.play()
        if (gain) ramp(VOLUME, 1.4)
        else a.volume = VOLUME
    } catch {
        // Autoplay refused or decode error: stay silent, the UI reflects `paused`.
    }
}

export function pause() {
    wanted = false
    const a = element()
    if (!gain) return a.pause()
    ramp(0, 0.5)
    // Unless play() was called again during the fade.
    setTimeout(() => !wanted && a.pause(), 550)
}

export function toggle() {
    return wanted ? pause() : play()
}

export function isPlaying() {
    return !!el && !el.paused
}

/** Smoothed low-end energy in [0, 1]; cheap enough to call every frame. */
export function getLevel() {
    if (!analyser || !isPlaying()) {
        level *= 0.92
        return level
    }
    analyser.getByteFrequencyData(bins)
    let sum = 0
    for (let i = 1; i < 12; i++) sum += bins[i]
    const target = Math.min(1, Math.max(0, (sum / 11 - 90) / 140))
    level += (target - level) * (target > level ? 0.5 : 0.08)
    return level
}

/** Fills `out` with `out.length` normalized bands, for the EQ meter. */
export function getBands(out) {
    if (!analyser || !isPlaying()) {
        for (let i = 0; i < out.length; i++) out[i] *= 0.85
        return out
    }
    analyser.getByteFrequencyData(bins)
    const span = Math.floor(48 / out.length)
    for (let i = 0; i < out.length; i++) {
        let s = 0
        for (let j = 0; j < span; j++) s += bins[2 + i * span + j]
        out[i] = s / span / 255
    }
    return out
}

function subscribe(l) {
    listeners.add(l)
    return () => listeners.delete(l)
}

export function usePlaying() {
    return useSyncExternalStore(subscribe, isPlaying, () => false)
}
