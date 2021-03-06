import { GeneralSteps } from '@ephox/agar';
import { Pipeline } from '@ephox/agar';
import { RawAssertions } from '@ephox/agar';
import { Step } from '@ephox/agar';
import { TinyApis } from '@ephox/mcagar';
import { TinyLoader } from '@ephox/mcagar';
import Plugin from 'tinymce/plugins/imagetools/Plugin';
import ModernTheme from 'tinymce/themes/modern/Theme';
import URI from 'tinymce/core/api/util/URI';
import ImageUtils from '../module/test/ImageUtils';
import { UnitTest } from '@ephox/bedrock';

UnitTest.asynctest('browser.tinymce.plugins.imagetools.ImageToolsPluginTest', function () {
  const success = arguments[arguments.length - 2];
  const failure = arguments[arguments.length - 1];
  const uploadHandlerState = ImageUtils.createStateContainer();

  const srcUrl = '/project/src/plugins/imagetools/demo/img/dogleft.jpg';

  ModernTheme();
  Plugin();

  const sAssertUploadFilename = function (expected) {
    return Step.sync(function () {
      const blobInfo = uploadHandlerState.get().blobInfo;
      RawAssertions.assertEq('Should be expected file name', expected, blobInfo.filename());
    });
  };

  const sAssertUri = function (expected) {
    return Step.sync(function () {
      const blobInfo = uploadHandlerState.get().blobInfo;
      const uri = new URI(blobInfo.uri());
      RawAssertions.assertEq('Should be expected uri', expected, uri.relative);
    });
  };

  TinyLoader.setup(function (editor, onSuccess, onFailure) {
    const tinyApis = TinyApis(editor);

    const sTestGenerateFileName = function () {
      return GeneralSteps.sequence([
        uploadHandlerState.sResetState,
        tinyApis.sSetSetting('images_reuse_filename', false),
        ImageUtils.sLoadImage(editor, srcUrl),
        tinyApis.sSelect('img', []),
        ImageUtils.sExecCommand(editor, 'mceImageFlipHorizontal'),
        ImageUtils.sWaitForBlobImage(editor),
        ImageUtils.sUploadImages(editor),
        uploadHandlerState.sWaitForState,
        sAssertUploadFilename('imagetools0.jpg')
      ]);
    };

    const sTestReuseFilename = function () {
      return GeneralSteps.sequence([
        uploadHandlerState.sResetState,
        tinyApis.sSetSetting('images_reuse_filename', true),
        ImageUtils.sLoadImage(editor, srcUrl),
        tinyApis.sSelect('img', []),
        ImageUtils.sExecCommand(editor, 'mceImageFlipHorizontal'),
        ImageUtils.sWaitForBlobImage(editor),
        ImageUtils.sUploadImages(editor),
        uploadHandlerState.sWaitForState,
        sAssertUploadFilename('dogleft.jpg'),
        sAssertUri(srcUrl)
      ]);
    };

    Pipeline.async({}, [
      sTestGenerateFileName(),
      sTestReuseFilename()
    ], onSuccess, onFailure);
  }, {
    plugins: 'imagetools',
    automatic_uploads: false,
    images_upload_handler: uploadHandlerState.handler(srcUrl),
    skin_url: '/project/js/tinymce/skins/lightgray'
  }, success, failure);
});
