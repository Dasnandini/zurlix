"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface CreateLinkModalContextType {
  isOpen: boolean;
  openModal: (onSuccess?: () => void) => void;
  closeModal: () => void;
  triggerSuccess: () => void;
}

const CreateLinkModalContext = createContext<CreateLinkModalContextType | undefined>(undefined);

export function CreateLinkModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [successCallback, setSuccessCallback] = useState<(() => void) | undefined>(undefined);

  const openModal = (onSuccess?: () => void) => {
    setSuccessCallback(() => onSuccess);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSuccessCallback(undefined);
  };

  const triggerSuccess = () => {
    if (successCallback) {
      successCallback();
    }
  };

  return (
    <CreateLinkModalContext.Provider
      value={{ isOpen, openModal, closeModal, triggerSuccess }}
    >
      {children}
    </CreateLinkModalContext.Provider>
  );
}

export function useCreateLinkModal() {
  const context = useContext(CreateLinkModalContext);
  if (!context) {
    throw new Error("useCreateLinkModal must be used within a CreateLinkModalProvider");
  }
  return context;
}
