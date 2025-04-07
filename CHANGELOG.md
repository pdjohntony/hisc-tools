# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2025-04-07

### Added

- Proper error handling and UI feedback during the save report process
- Added loading indicators for file processing and saving operations

### Changed

- Update drawer UI
  - Text is centered
  - Version numbers are bolded
  - Show current and new version numbers when update is available
  - Add a link to the release notes

### Fixed

- Fixed an issue where the scheduled clock in column was showing the actual clock in time
- Fixed an issue where error messages from previous runs were not cleared when the tool was re-run

## [1.0.1] - 2025-04-07

### Added

- Proper error handling and UI feedback
- Sentry integration for error tracking

### Fixed

- Fixed an issue where some spreadsheets have an incorrect `ws['!ref']` range that does not match the actual data in the sheet, causing an error. This is resolved by ensuring the range is recalculated based on the actual data in the worksheet.

## [1.0.0] - 2025-04-06

Initial Release

### Added

- Late Clock Ins tool
