const ConnectorCanvas = ({ children }) => {
  return <svg
    style={{
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
    }}
  >
    {children}
  </svg>
}

export default ConnectorCanvas