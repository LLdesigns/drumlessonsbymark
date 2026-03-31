import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'

const WaveformPlayerTest = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('Initializing...')

  useEffect(() => {
    if (!containerRef.current) {
      setStatus('No container ref')
      return
    }

    setStatus('Creating WaveSurfer instance...')
    console.log('WaveSurfer:', WaveSurfer)
    console.log('WaveSurfer.create:', typeof WaveSurfer.create)

    try {
      const wavesurfer = WaveSurfer.create({
        container: containerRef.current,
        waveColor: '#3b82f6',
        progressColor: '#2563eb',
        height: 100
      })

      setStatus('WaveSurfer created, loading test audio...')

      // Try loading a test audio file
      wavesurfer.on('ready', () => {
        setStatus('Audio loaded and ready!')
        console.log('Duration:', wavesurfer.getDuration())
      })

      wavesurfer.on('error', (err: Error) => {
        setStatus(`Error: ${err.message}`)
        console.error('WaveSurfer error:', err)
      })

      // Try with a public test audio URL
      wavesurfer.load('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3')

      return () => {
        wavesurfer.destroy()
      }
    } catch (error: any) {
      setStatus(`Failed to create: ${error.message}`)
      console.error('Error:', error)
    }
  }, [])

  return (
    <div style={{ padding: '20px', border: '2px solid red', margin: '20px' }}>
      <h3>Waveform Test Component</h3>
      <p>Status: {status}</p>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100px', 
          border: '2px solid blue',
          background: '#f0f0f0'
        }} 
      />
      <p style={{ fontSize: '12px', color: '#666' }}>
        If you see a waveform above, wavesurfer is working!
      </p>
    </div>
  )
}

export default WaveformPlayerTest

