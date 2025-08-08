/**
 * Generate notification sounds using Web Audio API
 * This creates simple tones for different notification types
 */

export class NotificationSoundGenerator {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private async resumeAudioContext() {
    if (!this.audioContext) {
      console.warn('🔊 Audio context not available');
      return false;
    }
    
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('🔊 Audio context resumed');
        return true;
      } catch (error) {
        console.error('🔊 Failed to resume audio context:', error);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Play a notification sound based on type
   */
  async playNotificationSound(type: 'newUser' | 'projectUpdate' | 'payment' | 'general' | 'emergency' | 'message' | 'newUserPriority') {
    if (!this.audioContext) {
      console.warn('🔊 No audio context available for notification sound');
      return;
    }

    try {
      console.log(`🔊 Playing ${type} notification sound...`);
      const audioResumed = await this.resumeAudioContext();
      if (!audioResumed) {
        console.warn('🔊 Could not resume audio context');
        return;
      }

      let frequencies: number[];
      let duration = 0.6; // Longer base duration
      let volume = 0.3; // Higher volume
      let waveType: OscillatorType = 'sine'; // Default wave type

      switch (type) {
        case 'newUser':
          // Happy ascending tone - more prominent
          frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
          duration = 0.5;
          volume = 0.4;
          waveType = 'triangle'; // Warmer sound for welcomes
          break;
        case 'projectUpdate':
          // Informative triple beep - louder
          frequencies = [440, 554.37, 659.25]; // A4, C#5, E5
          duration = 0.4;
          volume = 0.3;
          waveType = 'sine'; // Clean professional sound
          break;
        case 'payment':
          // Success tone - celebratory
          frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
          duration = 0.4;
          volume = 0.4;
          waveType = 'triangle'; // Rich success sound
          break;
        case 'emergency':
          // Urgent alarm - very loud and attention-grabbing
          frequencies = [880, 660, 880, 660, 880, 660]; // A5, E5 repeated
          duration = 0.25;
          volume = 0.6; // Loudest for emergencies
          waveType = 'square'; // Sharp, urgent sound
          break;
        case 'newUserPriority':
          // Priority new user alert - distinctive and attention-demanding
          frequencies = [523.25, 659.25, 783.99, 1046.50, 659.25, 523.25]; // C5, E5, G5, C6, E5, C5 (welcome melody)
          duration = 0.4;
          volume = 0.55; // Very loud but not harsh
          waveType = 'triangle'; // Rich, welcoming but urgent sound
          break;
        case 'message':
          // Message notification - distinctive and pleasant (most common sound)
          frequencies = [659.25, 783.99, 659.25]; // E5, G5, E5 (like a phone ringtone)
          duration = 0.5;
          volume = 0.45; // Loud enough to be clearly heard
          waveType = 'sine'; // Pleasant, non-jarring sound
          break;
        default:
          // General notification - clear and audible
          frequencies = [440, 554.37]; // A4, C#5
          duration = 0.5;
          volume = 0.35;
          waveType = 'sine';
      }

      // Play each frequency in sequence with proper volume and wave type
      for (let i = 0; i < frequencies.length; i++) {
        await this.playTone(frequencies[i], duration, i * duration * 0.2, volume, waveType);
      }
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  /**
   * Play a single tone
   */
  private playTone(frequency: number, duration: number, delay: number = 0, volume: number = 0.3, waveType: OscillatorType = 'sine'): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext) {
        resolve();
        return;
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime + delay);
      oscillator.type = waveType;

      // Envelope for smooth sound with custom volume
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + delay + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + delay + duration - 0.05);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + delay + duration);

      oscillator.start(this.audioContext.currentTime + delay);
      oscillator.stop(this.audioContext.currentTime + delay + duration);

      oscillator.onended = () => resolve();
    });
  }

  /**
   * Test all notification sounds
   */
  async testAllSounds() {
    const types: Array<'newUser' | 'projectUpdate' | 'payment' | 'general' | 'emergency' | 'message' | 'newUserPriority'> = [
      'message', 'newUser', 'newUserPriority', 'projectUpdate', 'payment', 'emergency', 'general'
    ];

    console.log('🔊 Testing all notification sounds with enhanced volume...');
    for (let i = 0; i < types.length; i++) {
      console.log(`🔊 Playing ${types[i]} sound... (${i + 1}/${types.length})`);
      await this.playNotificationSound(types[i]);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds between sounds
    }
    console.log('🎉 Sound test completed!');
  }
}

// Singleton instance
export const soundGenerator = new NotificationSoundGenerator(); 