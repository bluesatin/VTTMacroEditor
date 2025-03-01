// import * as acemodule from "./lib/ace.js";

/* -------------< Ace >------------ */
Hooks.once("init", () => {
  ["ace/mode/javascript", "ace/ext/language_tools", "ace/ext/error_marker", "ace/theme/twilight", "ace/snippets/javascript"].forEach((s) => ace.config.loadModule(s));
});
/* -------------< End Ace >------------ */

Hooks.on("renderMacroConfig", function (macroConfig) {
  /** @type {JQuery} */
  const configElement = macroConfig.element;
  configElement
    .find("div.form-group.stacked.command")
    .append(
      `<button type="button" class="macro-editor-expand" title="Expand Editor"><i class="fas fa-expand-alt"></i></button><div class="macro-editor" id="macroEditor-${macroConfig.object.id}"></div>`
    );
  if (game.settings.get("macroeditor", "defaultShow")) {
    configElement.find('.command textarea[name="command"]').css("display", "none");

    // furnace compat
    const furnace = configElement.find("div.furnace-macro-command");
    if (furnace.length !== 0) {
      furnace.css("display", "none");
    }
  } else {
    configElement.find(".macro-editor").css("display", "none");
    configElement.find(".macro-editor-expand").css("display", "none");
  }

  configElement
    .find(".sheet-footer")
    .append('<button type="button" class="macro-editor-button" title="Toggle Code Editor" name="editorButton"><i class="fas fa-terminal"></i></button>');

  let editor = ace.edit(`macroEditor-${macroConfig.object.id}`);
  editor.setOptions({
    mode: "ace/mode/javascript",
    theme: "ace/theme/twilight",
    showPrintMargin: false,
    foldStyle: "markbegin",
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true,
  });

  if (game.settings.get("macroeditor", "lineWrap")) {
    editor.getSession().setUseWrapMode(true);
  } else {
    editor.getSession().setUseWrapMode(false);
  }

  configElement.find(".macro-editor-button").on("click", (event) => {
    event.preventDefault();
    if (configElement.find(".macro-editor").css("display") == "none") {
      configElement.find('.command textarea[name="command"]').css("display", "none");
      configElement.find(".macro-editor").css("display", "");
      configElement.find(".macro-editor-expand").css("display", "");
      editor.setValue(configElement.find('.command textarea[name="command"]').val(), -1);

      // furnace compat
      const furnace = configElement.find("div.furnace-macro-command");
      if (furnace.length !== 0) {
        furnace.css("display", "none");
      }
    } else {
      configElement.find('.command textarea[name="command"]').css("display", "");
      configElement.find(".macro-editor").css("display", "none");
      configElement.find(".macro-editor-expand").css("display", "none");

      // furnace compat
      const furnace = configElement.find("div.furnace-macro-command");
      if (furnace.length !== 0) {
        furnace.css("display", "");
        furnace.trigger("change");
      }
    }
  });

  configElement.find(".macro-editor-expand").on("click", (event) => {
    event.preventDefault();
    if (configElement.find(".macro-editor").hasClass("fullscreen")) {
      configElement.find(".macro-editor").removeClass("fullscreen");
      configElement.find(".macro-editor-expand").removeClass("fullscreen");
      configElement.find(".macro-editor-expand").prop("title", "Expand Editor");
      configElement.find(".macro-editor-expand i.fas.fa-compress-alt").attr("class", "fas fa-expand-alt");
      configElement.find(".window-resizable-handle").css("display", "");
    } else {
      configElement.find(".macro-editor").addClass("fullscreen");
      configElement.find(".macro-editor-expand").addClass("fullscreen");
      configElement.find(".macro-editor-expand").prop("title", "Shrink Editor");
      configElement.find(".macro-editor-expand i.fas.fa-expand-alt").attr("class", "fas fa-compress-alt");
      configElement.find(".window-resizable-handle").css("display", "none");
    }
  });

  editor.setValue(configElement.find('textarea[name="command"]').val(), -1);

  editor.getSession().on("change", () => {
    configElement.find('textarea[name="command"]').val(editor.getSession().getValue());
  });

  editor.commands.addCommand({
    name: "Save",
    bindKey: { win: "Ctrl-S", mac: "Command-S" },
    exec: () => configElement.find("form.editable").trigger("submit"),
  });

  editor.commands.addCommand({
    name: "Execute",
    bindKey: { win: "Ctrl-E", mac: "Command-E" },
    exec: () => configElement.find("button.execute").trigger("click"),
  });

  // watch for resizing of editor
  new ResizeObserver(() => {
    editor.resize();
    editor.renderer.updateFull();
  }).observe(editor.container);

  createMacroConfigHook(macroConfig.id, editor);
});

Hooks.once("init", function () {
  game.settings.register("macroeditor", "defaultShow", {
    name: "Show Macro editor by default",
    hint: "Shows the code editor by default instead of the default editor",
    default: true,
    type: Boolean,
    scope: "client",
    config: true,
  });

  game.settings.register("macroeditor", "lineWrap", {
    name: "Wrap lines?",
    default: true,
    type: Boolean,
    scope: "client",
    config: true,
  });
});

/**
 * @param  {String} id
 * @param  {AceAjax.Editor} editor
 */
function createMacroConfigHook(id, editor) {
  Hooks.once("closeMacroConfig", function (macroConfig) {
    if (id === macroConfig.id) {
      editor.destroy();
    } else {
      createMacroConfigHook(id, editor);
    }
  });
}
