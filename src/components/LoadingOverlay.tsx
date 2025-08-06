import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
  style?: 'fullscreen' | 'overlay' | 'inline';
  backgroundColor?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible, 
  text = 'Loading...', 
  style = 'overlay',
  backgroundColor = 'rgba(0,0,0,0.7)'
}) => {
  if (!visible) return null;

  const renderContent = () => (
    <View style={[
      styles.container,
      style === 'fullscreen' && styles.fullscreen,
      style === 'overlay' && styles.overlay,
      style === 'inline' && styles.inline,
      { backgroundColor: style === 'inline' ? 'transparent' : backgroundColor }
    ]}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[
          styles.text,
          style === 'inline' && styles.inlineText
        ]}>
          {text}
        </Text>
      </View>
    </View>
  );

  if (style === 'overlay') {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        statusBarTranslucent
      >
        {renderContent()}
      </Modal>
    );
  }

  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inline: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  content: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  text: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  inlineText: {
    color: '#007AFF',
  },
});

export default LoadingOverlay; 