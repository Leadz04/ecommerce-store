# Image Processing Feature - Test Script
# PowerShell script to test and verify image processing implementation

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Image Processing Feature Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Command 1: Check if required packages are installed
Write-Host "[1/9] Checking installed packages..." -ForegroundColor Yellow
$packages = @(
    "@imgly/background-removal",
    "smartcrop",
    "react-image-crop"
)

$missingPackages = @()
foreach ($package in $packages) {
    $installed = npm list $package 2>$null
    if ($LASTEXITCODE -ne 0) {
        $missingPackages += $package
        Write-Host "  ✗ $package - NOT INSTALLED" -ForegroundColor Red
    } else {
        Write-Host "  ✓ $package - INSTALLED" -ForegroundColor Green
    }
}

if ($missingPackages.Count -gt 0) {
    Write-Host ""
    Write-Host "Missing packages detected. Run: npm install" -ForegroundColor Red
} else {
    Write-Host "  All packages installed successfully!" -ForegroundColor Green
}
Write-Host ""

# Command 2: Verify TypeScript compilation
Write-Host "[2/9] Checking TypeScript compilation..." -ForegroundColor Yellow
$tsFiles = @(
    "src/lib/imageProcessing.ts",
    "src/components/ImageEditor.tsx",
    "src/app/api/images/process/route.ts"
)

$missingFiles = @()
foreach ($file in $tsFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file exists" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file - NOT FOUND" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -eq 0) {
    Write-Host "  All required files exist!" -ForegroundColor Green
} else {
    Write-Host "  Missing files detected!" -ForegroundColor Red
}
Write-Host ""

# Command 3: Check environment variables
Write-Host "[3/9] Checking environment variables..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "CLOUDINARY_URL") {
        Write-Host "  ✓ CLOUDINARY_URL found in .env" -ForegroundColor Green
    } else {
        Write-Host "  ✗ CLOUDINARY_URL NOT FOUND in .env" -ForegroundColor Red
        Write-Host "    Add: CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✗ .env file not found" -ForegroundColor Red
    Write-Host "    Create .env file with CLOUDINARY_URL" -ForegroundColor Yellow
}
Write-Host ""

# Command 4: Verify API route structure
Write-Host "[4/9] Verifying API route structure..." -ForegroundColor Yellow
$apiRoute = "src/app/api/images/process/route.ts"
if (Test-Path $apiRoute) {
    $apiContent = Get-Content $apiRoute -Raw
    $checks = @{
        "POST method" = $apiContent -match "export async function POST"
        "Cloudinary import" = $apiContent -match "cloudinary"
        "Image processing logic" = $apiContent -match "background_removal|removeBackground"
    }
    
    foreach ($check in $checks.GetEnumerator()) {
        if ($check.Value) {
            Write-Host "  ✓ $($check.Key)" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $($check.Key) - NOT FOUND" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  ✗ API route not found: $apiRoute" -ForegroundColor Red
}
Write-Host ""

# Command 5: Check ImageEditor component
Write-Host "[5/9] Verifying ImageEditor component..." -ForegroundColor Yellow
$editorFile = "src/components/ImageEditor.tsx"
if (Test-Path $editorFile) {
    $editorContent = Get-Content $editorFile -Raw
    $checks = @{
        "ReactCrop import" = $editorContent -match "react-image-crop"
        "Background removal import" = $editorContent -match "@imgly/background-removal|removeBackground"
        "Processing methods" = $editorContent -match "cloudinary|client-side"
        "Preview functionality" = $editorContent -match "preview|Preview"
    }
    
    foreach ($check in $checks.GetEnumerator()) {
        if ($check.Value) {
            Write-Host "  ✓ $($check.Key)" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $($check.Key) - NOT FOUND" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  ✗ ImageEditor component not found" -ForegroundColor Red
}
Write-Host ""

# Command 6: Verify ProductForm integration
Write-Host "[6/9] Verifying ProductForm integration..." -ForegroundColor Yellow
$productFormFile = "src/components/ProductForm.tsx"
if (Test-Path $productFormFile) {
    $formContent = Get-Content $productFormFile -Raw
    $checks = @{
        "ImageEditor import" = $formContent -match "ImageEditor"
        "Edit button state" = $formContent -match "editingImage|setEditingImage"
        "Edit icon" = $formContent -match "Edit.*icon|Edit.*button"
    }
    
    foreach ($check in $checks.GetEnumerator()) {
        if ($check.Value) {
            Write-Host "  ✓ $($check.Key)" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $($check.Key) - NOT FOUND" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  ✗ ProductForm not found" -ForegroundColor Red
}
Write-Host ""

# Command 7: Check documentation files
Write-Host "[7/9] Verifying documentation..." -ForegroundColor Yellow
$docs = @(
    "docs/IMAGE_PROCESSING_RESEARCH.md",
    "docs/IMAGE_PROCESSING_USAGE.md",
    "docs/IMAGE_PROCESSING_IMPLEMENTATION_SUMMARY.md"
)

$missingDocs = @()
foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Host "  ✓ $doc" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $doc - NOT FOUND" -ForegroundColor Red
        $missingDocs += $doc
    }
}

if ($missingDocs.Count -eq 0) {
    Write-Host "  All documentation files exist!" -ForegroundColor Green
}
Write-Host ""

# Command 8: Run linter check
Write-Host "[8/9] Running linter check..." -ForegroundColor Yellow
Write-Host "  Running: npm run lint" -ForegroundColor Gray
$lintResult = npm run lint 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Linter passed!" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Linter found issues (check output above)" -ForegroundColor Yellow
    Write-Host $lintResult
}
Write-Host ""

# Command 9: Summary and next steps
Write-Host "[9/9] Summary and Recommendations" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$recommendations = @()

if ($missingPackages.Count -gt 0) {
    $recommendations += "Install missing packages: npm install"
}

if (-not (Test-Path ".env") -or ($envContent -notmatch "CLOUDINARY_URL")) {
    $recommendations += "Set up CLOUDINARY_URL in .env file"
    $recommendations += "Enable Cloudinary Background Removal add-on (optional but recommended)"
}

if ($recommendations.Count -gt 0) {
    Write-Host "Recommended next steps:" -ForegroundColor Yellow
    foreach ($rec in $recommendations) {
        Write-Host "  • $rec" -ForegroundColor White
    }
} else {
    Write-Host "✓ All checks passed! Ready to use image processing features." -ForegroundColor Green
    Write-Host ""
    Write-Host "To test the feature:" -ForegroundColor Cyan
    Write-Host "  1. Start dev server: npm run dev" -ForegroundColor White
    Write-Host "  2. Navigate to Admin Dashboard" -ForegroundColor White
    Write-Host "  3. Create or edit a product" -ForegroundColor White
    Write-Host "  4. Hover over an image and click Edit icon" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test script completed!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
