import React, { Fragment, useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import electronLog from 'electron-log'
import { useRouter } from 'next/dist/client/router'
import Script from 'next/script'

import {
  dialogInitialState,
  SettingsDialogKey,
  SettingsDialogStorage,
  useMostRecentConversation,
  useSettingList,
} from '../utils'
import {
  useAppConfigurations,
  ConversationProvider,
  useConversations,
  useActiveConversationContext,
  useClassifyInstances,
} from '../state'
import HomeContext from '../context'
import DisplayDocs from '../components/layout/DisplayDocs'
import LoadingPage from '../components/layout/LoadingPage'
import FolderTabs from '../components/ui/FolderTabs'
import SettingsDialog from '../components/settings-dialog/SettingsDialog'
import ChatArea from '../components/layout/ChatArea'
import Overlay from '../components/Overlay/Overlay'
import Cookies from 'js-cookie'

import styles from '../styles/components/Home.module.scss'
import { CONVERSATIONS_DOCS, HOW_TO_GUIDE } from '../constants'
import { useClassifyFolderOccurrences } from 'state/selectors'

type Props = {
  serverSideApiKeyIsSet: boolean
  serverSidePluginKeysSet: boolean
  defaultModelId: string
}

const Home = ({
  serverSideApiKeyIsSet,
  serverSidePluginKeysSet,
  defaultModelId,
}: Props) => {
  const router = useRouter()
  const [helpDocsVisible, setHelpDocsVisible] = useState(true)
  const {
    isConfigLoading,
    lightModeEnabled,
    defaultLanguageModel,
    isConversationBrowserVisible,
    setIsConversationBrowserVisible,
  } = useAppConfigurations()
  const selectedConversation = useMostRecentConversation()
  const { mutate: updateActiveConversationEntries } = useActiveConversationContext()
  const { onOpen } = useSettingList(SettingsDialogKey, SettingsDialogStorage)
  const conversation = useConversations(undefined, {
    enabled: selectedConversation,
  })
  const openFilesPanel = () => setIsConversationBrowserVisible(true)
  const { getRootProps } = useClassifyInstances()
  const lightMode = lightModeEnabled ? styles.lightMode : undefined
  const updatedClassifyFolderOccurrences = useClassifyFolderOccurrences()

  useEffect(() => {
    electronLog.transports.file.maxSize = 100000
    const d = Cookies.get('docs')
    if (d === 'false') {
      setHelpDocsVisible(false)
    }
  }, [])

  useEffect(() => {
    window.LA && window.LA.init({id:"3GZORVyxiPPrdcYf",ck:"3GZORVyxiPPrdcYf"})
  }, [])

  useEffect(() => {
    if (selectedConversation && !conversation.isLoading) {
      updateActiveConversationEntries(conversation.data || dialogInitialState)
    }
  }, [selectedConversation, conversation.isLoading])

  
  return (
    <HomeContext.Provider
      value={{
        isConfigLoading,
        isConversationBrowserVisible,
        setIsConversationBrowserVisible,
        updateActiveConversationEntries,
        selectedConversation,
        helpDocsVisible,
        setHelpDocsVisible,
      }}
    >
      <Head>
        <title>Chat with a Language Model - Use this application to write, draft, and brainstorm.</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <Script 
        id="LA_COLLECT"
        src="//sdk.51.la/js-sdk-pro.min.js"
        strategy="afterInteractive" 
        onLoad={() => console.log("Script loaded")} 
      />
      {selectedConversation && (
        <Fragment>
          <main
            className={`flex h-screen w-screen flex-col text-sm text-white dark:text-white ${lightMode}`}
          >
            <FolderTabs openSettings={onOpen} openFilesPanel={openFilesPanel} />
            <ChatArea />
            <Overlay />
            <SettingsDialog />
          </main>
        </Fragment>
      )}
      {!selectedConversation && <DisplayDocs />}
      {helpDocsVisible && (
        <DisplayDocs
          heading={'How To Guide'}
          sections={HOW_TO_GUIDE}
          onHide={() => setHelpDocsVisible(false)}
        />
      )}
      {helpDocsVisible && (
        <DisplayDocs
          heading={'Conversation Browser'}
          sections={CONVERSATIONS_DOCS}
          onHide={() => setHelpDocsVisible(false)}
        />
      )}
    </HomeContext.Provider>
  )
}
export default Home

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const i18n = require('../i18n/index')
  const { defaultNs } = i18n.i18nConfig

  const serverSideApiKeyIsSet = Boolean(process.env.OPENAI_SECRET_KEY)
  const serverSidePluginKeysSet = Boolean(process.env.AIRTABLE_BASE_ID)
  const defaultModelId = process.env.DEFAULT_MODEL_ID || ''
  return {
    props: {
      ...i18n.appWithTranslation.getServerSideProps(locale, defaultNs),
      serverSideApiKeyIsSet,
      serverSidePluginKeysSet,
      defaultModelId,
    },
  }
}
