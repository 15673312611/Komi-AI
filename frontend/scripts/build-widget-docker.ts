import { build } from 'vite'
import { resolve } from 'path'
import * as fs from 'fs'
import * as path from 'path'

const config = resolve(process.cwd(), 'vite.widget.docker.config.ts')
// For Docker, we need to copy to a shared volume or mounted directory
// This assumes the backend assets are mounted/shared between containers
const assetsDir = resolve(process.cwd(), '/app/backend-assets')
const filesToKeep = ['widget.js', 'widget.css']

async function buildWidgetDocker() {
  try {
    // Ensure the backend assets directory exists
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true })
      console.log(`Created backend assets directory: ${assetsDir}`)
    }

    // Run the Vite build
    await build({ configFile: config })
    console.log('Vite build completed')

    // Copy CSS file from unused directory to the root assets directory
    const unusedDir = path.join(assetsDir, 'unused')
    if (fs.existsSync(unusedDir)) {
      const files = fs.readdirSync(unusedDir)
      const cssFile = files.find(file => file.endsWith('.css'))
      
      if (cssFile) {
        const sourcePath = path.join(unusedDir, cssFile)
        const destPath = path.join(assetsDir, 'widget.css')
        
        fs.copyFileSync(sourcePath, destPath)
        console.log(`Copied CSS file to ${destPath}`)
      }
      
      // Clean up unused directory
      fs.rmSync(unusedDir, { recursive: true, force: true })
      console.log('Cleaned up unused directory')
    }

    // Clean up the assets directory - keep only widget.js and widget.css
    const entries = fs.readdirSync(assetsDir)
    
    for (const entry of entries) {
      if (!filesToKeep.includes(entry)) {
        const entryPath = path.join(assetsDir, entry)
        
        if (fs.statSync(entryPath).isDirectory()) {
          fs.rmSync(entryPath, { recursive: true, force: true })
        } else {
          fs.unlinkSync(entryPath)
        }
      }
    }
    
    console.log(`Cleaned up assets directory, keeping only: ${filesToKeep.join(', ')}`)
    console.log('Widget built successfully for Docker!')
    console.log(`Files available at: ${assetsDir}`)
  } catch (error) {
    console.error('Docker widget build failed:', error)
    process.exit(1)
  }
}

buildWidgetDocker() 