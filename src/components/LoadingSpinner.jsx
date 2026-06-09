export default function LoadingSpinner({ text = 'טוען...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
      <span style={{ fontSize: 42, display: 'inline-block', animation: 'lift 0.8s ease-in-out infinite alternate' }}>🏋️</span>
      <style>{`@keyframes lift { from { transform: translateY(0px); } to { transform: translateY(-10px); } }`}</style>
      <span style={{ color: '#aaa', fontSize: 14 }}>{text}</span>
    </div>
  );
}
