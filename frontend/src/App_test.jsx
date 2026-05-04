import { useState } from 'react'
import JDTranslator from './JDTranslator_simple'

function App() {
  const [page, setPage] = useState('jd');

  return (
    <div>
      <button onClick={() => setPage('jd')}>JD</button>
      {page === 'jd' && <JDTranslator />}
    </div>
  );
}

export default App
