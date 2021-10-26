'use strict'
import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { window } from 'vscode'
import VSPicgo from './vs-picgo'
import { PanelManager } from './vs-picgo/PanelManager'
import { detectImgUrlRange } from './vs-picgo/utils'

async function uploadImageFromClipboard(vspicgo: VSPicgo) {
  return await vspicgo.upload()
}

async function uploadImageFromExplorer(vspicgo: VSPicgo) {
  const result = await vscode.window.showOpenDialog({
    filters: {
      Images: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'ico', 'svg']
    },
    canSelectMany: true
  })

  if (result != null) {
    const input = result.map((item) => item.fsPath)
    return vspicgo.upload(input)
  }
}

async function uploadImageFromInputBox(vspicgo: VSPicgo) {
  let result = await vscode.window.showInputBox({
    placeHolder: 'Please input an image location path'
  })
  // check if `result` is a path of image file
  const imageReg = /\.(png|jpg|jpeg|webp|gif|bmp|tiff|ico|svg)$/
  if (result && imageReg.test(result)) {
    result = path.isAbsolute(result)
      ? result
      : path.join(vspicgo.editor?.document.uri.fsPath ?? '', '../', result)
    if (fs.existsSync(result)) {
      return await vspicgo.upload([result])
    } else {
      await vscode.window.showErrorMessage('No such image.')
    }
  } else {
    await vscode.window.showErrorMessage('No such image.')
  }
}

async function uploadImageFromCursor(vspicgo: VSPicgo) {
  const urlRange = await detectImgUrlRange()
  if (!urlRange) {
    return await window.showInformationMessage('Can not detect image url!!')
  }

  const editor = window.activeTextEditor
  if (!editor) {
    return
  }
  const doc = editor.document
  const url = doc.getText(urlRange)

  if (!url) {
    return await window.showInformationMessage('Can not detect image url!!')
  }

  return await vspicgo.upload([url])
}

export async function activate(context: vscode.ExtensionContext) {
  const panelManager = new PanelManager(context)
  const disposable = [
    vscode.commands.registerCommand(
      'picgo.uploadImageFromClipboard',
      async () => {
        const vspicgo = new VSPicgo()
        vspicgo.addGenerateOutputListener()
        await uploadImageFromClipboard(vspicgo)
      }
    ),
    vscode.commands.registerCommand(
      'picgo.uploadImageFromExplorer',
      async () => {
        const vspicgo = new VSPicgo()
        vspicgo.addGenerateOutputListener()
        await uploadImageFromExplorer(vspicgo)
      }
    ),
    vscode.commands.registerCommand(
      'picgo.uploadImageFromInputBox',
      async () => {
        const vspicgo = new VSPicgo()
        vspicgo.addGenerateOutputListener()
        await uploadImageFromInputBox(vspicgo)
      }
    ),
    vscode.commands.registerCommand('picgo.uploadImageFromCursor', async () => {
      const vspicgo = new VSPicgo()
      vspicgo.addChangeUrlListener()
      await uploadImageFromCursor(vspicgo)
    }),

    vscode.commands.registerCommand('picgo.webviewDemo', () =>
      panelManager.createOrShowWebviewPanel('Demo')
    ),
    vscode.commands.registerCommand('picgo.webviewPicGoControlPanel', () =>
      panelManager.createOrShowWebviewPanel('PicGoControlPanel')
    )
  ]
  context.subscriptions.push(...disposable)

  if (process.env.NODE_ENV === 'development') {
    panelManager.createOrShowWebviewPanel('PicGoControlPanel')
  }
}

export function deactivate() {}
