import React, { createContext, useContext, useState } from 'react';

interface ExamContextType {
  examInProgress: boolean;
  setExamInProgress: (value: boolean) => void;
}

const ExamContext = createContext<ExamContextType>({
  examInProgress: false,
  setExamInProgress: () => {},
});

export const ExamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [examInProgress, setExamInProgress] = useState(false);
  return (
    <ExamContext.Provider value={{ examInProgress, setExamInProgress }}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => useContext(ExamContext);
