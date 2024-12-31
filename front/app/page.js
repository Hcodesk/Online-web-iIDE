import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export default function Home() {

  const [fileTree, setFileTree] = useState({}) //stocke l'arborescence des fichiers
  const [selectedFile, setSelectedFile] = useState('') //stocke le chemin du fichier actuellement sélectionné
  const [selectedFileContent, setSelectedFileContent] = useState('') //stocke le contenu du fichier actuellement sélectionné
  const [code, setCode] = useState('') //stocke le code actuellement édité dans l'éditeur
  const isSaved = selectedFileContent === code


  //useEffect pour gérer le changement de contenu d'un fichier
  useEffect(() => {
      if(!isSaved && code) {
        const timer = setTimeout(() => {
            WebSocket.emit("file:change", {
                path: selectedFile,
                content:code
            })
        }, 5 * 1000)

        return () => {
            clearTimeout(timer) //néttoyage du timer pour annuler le minuteur si l'effet est réexécuté avant la fin des 5sec
        }
      }
  }, [code , selectedFile, isSaved]) //l'éffet sera réexécuté chaque fois que leurs valeurs changent

  //useEffect pour rénitialisé le contenu de code
  useEffect(() => {
    setCode("")
  }, [selectedFile])

  //useEffect pour mettre à jour code avec le contenu du fichier selectionné
  useEffect(() => {
     setCode(selectedFileContent)
  })

  //fonction pour récupérer l'arborescence de fichiers
  const getFileTree = async () => {
      const response = await fetch('http://localhost:9000/files')
      const result = await response.json()
      setFileTree(result.tree)
  }

  //récupérer le contenu des fichiers
  const getFileContents = useCallback(async () => {
      if (!selectedFile) return;
      const response = await fetch(
          `http://localhost:9000/files/content?path=${selectedFile}`
      )
      const result = await response.json()
      setSelectedFileContent(result.content)
  }, [selectedFile])

  return (
     <div>
        never give up
     </div>
  );
}
